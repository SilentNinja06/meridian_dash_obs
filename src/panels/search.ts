import { TFile, prepareFuzzySearch } from "obsidian";
import { BasePanel, placard } from "./types";
import { NewCategoryModal, NewNoteModal, runAssignFlow } from "./categorymodals";

/**
 * Knowledge-base search (§7.12). Fuzzy search scoped to the configured folder
 * only (default `Knowledge base/Notes/`) — not Categories, not Recipes. Uses
 * Obsidian's `prepareFuzzySearch` over filenames and headings (read from the
 * metadata cache, so it stays instant on mobile). Enter opens; arrow keys
 * navigate on desktop.
 */
interface Candidate {
	file: TFile;
	basename: string;
	headings: string[];
}

interface Hit {
	file: TFile;
	title: string;
	context: string;
	score: number;
}

export class SearchPanel extends BasePanel {
	id = "search";
	title = "Knowledge Base";
	private index: Candidate[] = [];
	private selected = 0;
	private hits: Hit[] = [];
	private resultsEl?: HTMLElement;
	private inputEl?: HTMLInputElement;

	protected async setup(): Promise<void> {
		this.buildIndex();
	}

	private buildIndex(): void {
		const path = normalizeFolder(this.ctx.settings().kbSearchPath);
		this.index = [];
		for (const file of this.ctx.app.vault.getMarkdownFiles()) {
			if (path && !file.path.startsWith(path)) continue;
			const cache = this.ctx.app.metadataCache.getFileCache(file);
			const headings = (cache?.headings ?? []).map((h) => h.heading);
			this.index.push({ file, basename: file.basename, headings });
		}
	}

	protected renderBody(): void {
		this.buildIndex();
		placard(this.el, "Knowledge Base");

		// Notes + category management.
		const store = this.ctx.plugin.knowledgeBase;
		const actions = this.el.createDiv({ cls: "mrd-btn-row" });
		const note = actions.createEl("button", { cls: "mrd-btn mrd-btn-primary", text: "+ Note" });
		note.addEventListener("click", () => new NewNoteModal(this.ctx.app, store, () => this.rerender()).open());
		const cat = actions.createEl("button", { cls: "mrd-btn", text: "+ Category" });
		cat.addEventListener("click", () => new NewCategoryModal(this.ctx.app, store, () => this.rerender()).open());
		const assign = actions.createEl("button", { cls: "mrd-btn", text: "Assign to category" });
		assign.addEventListener("click", () => runAssignFlow(this.ctx.app, store, () => this.rerender()));

		const input = this.el.createEl("input", {
			cls: "mrd-search-input",
			attr: { type: "search", placeholder: "Search the knowledge base…", enterkeyhint: "search" },
		});
		this.inputEl = input;
		this.resultsEl = this.el.createDiv({ cls: "mrd-search-results" });

		input.addEventListener("input", () => this.runQuery(input.value));
		input.addEventListener("keydown", (e) => this.onKey(e));
		this.runQuery("");

		this.renderCategories();
	}

	private renderCategories(): void {
		const store = this.ctx.plugin.knowledgeBase;
		const cats = store.listCategories();
		const section = this.el.createDiv({ cls: "mrd-sb-cats" });
		section.createDiv({ cls: "mrd-subhead", text: `Categories · ${cats.length}` });
		if (cats.length === 0) {
			section.createDiv({ cls: "mrd-muted", text: "No categories yet. Create one to start organizing." });
			return;
		}
		for (const cat of cats) {
			const details = section.createEl("details", { cls: "mrd-sb-cat" });
			const summary = details.createEl("summary");
			summary.createSpan({ cls: "mrd-sb-cat-name", text: cat.name });
			const count = summary.createSpan({ cls: "mrd-chip mrd-chip-cold", text: "…" });
			details.addEventListener("toggle", async () => {
				if (!details.open) return;
				const members = await store.categoryMembers(cat.file);
				count.setText(String(members.length));
				const body = (details.querySelector(".mrd-sb-cat-body") as HTMLElement) ?? details.createDiv({ cls: "mrd-sb-cat-body" });
				body.empty();
				if (members.length === 0) body.createDiv({ cls: "mrd-muted", text: "Empty." });
				for (const m of members) {
					const row = body.createDiv({ cls: "mrd-sb-member" });
					const link = row.createEl("a", { cls: "mrd-sb-link", text: m });
					link.addEventListener("click", (e) => {
						e.preventDefault();
						void this.ctx.app.workspace.openLinkText(m, cat.file.path, false);
					});
				}
			});
		}
	}

	private runQuery(query: string): void {
		const q = query.trim();
		this.hits = [];
		this.selected = 0;
		if (q) {
			const search = prepareFuzzySearch(q);
			for (const cand of this.index) {
				let best = search(cand.basename);
				let context = "";
				let title = cand.basename;
				for (const h of cand.headings) {
					const r = search(h);
					if (r && (!best || r.score > best.score)) {
						best = r;
						context = h;
					}
				}
				if (best) this.hits.push({ file: cand.file, title, context, score: best.score });
			}
			this.hits.sort((a, b) => b.score - a.score);
			this.hits = this.hits.slice(0, 20);
		}
		this.renderResults();
	}

	private renderResults(): void {
		const el = this.resultsEl;
		if (!el) return;
		el.empty();
		if (!this.inputEl?.value.trim()) {
			el.createDiv({ cls: "mrd-muted", text: `${this.index.length} notes indexed. Begin typing to search.` });
			return;
		}
		if (this.hits.length === 0) {
			el.createDiv({ cls: "mrd-muted", text: "No matches in the knowledge base." });
			return;
		}
		this.hits.forEach((hit, i) => {
			const row = el.createDiv({ cls: "mrd-search-row" });
			if (i === this.selected) row.addClass("is-selected");
			row.createDiv({ cls: "mrd-search-title", text: hit.title });
			if (hit.context && hit.context !== hit.title) row.createDiv({ cls: "mrd-search-context", text: hit.context });
			row.addEventListener("click", () => this.open(hit.file));
		});
	}

	private onKey(e: KeyboardEvent): void {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			this.selected = Math.min(this.hits.length - 1, this.selected + 1);
			this.renderResults();
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			this.selected = Math.max(0, this.selected - 1);
			this.renderResults();
		} else if (e.key === "Enter") {
			e.preventDefault();
			const hit = this.hits[this.selected];
			if (hit) this.open(hit.file);
		}
	}

	private open(file: TFile): void {
		void this.ctx.app.workspace.getLeaf(false).openFile(file);
	}
}

function normalizeFolder(path: string): string {
	const p = path.trim().replace(/^\/+/, "");
	if (!p) return "";
	return p.endsWith("/") ? p : p + "/";
}

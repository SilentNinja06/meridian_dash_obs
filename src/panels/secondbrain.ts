import { App, FuzzySuggestModal, Modal, Notice, Setting, TFile, prepareFuzzySearch } from "obsidian";
import { BasePanel, placard } from "./types";
import { SecondBrainStore } from "../core/secondbrain";

/**
 * Second Brain panel — manage the ongoing-project library from the dashboard:
 * search it, archive notes into its Archive subfolder, create notes and
 * categories, assign notes to categories (writing both the frontmatter entry
 * and the alphabetized wikilink in the category note).
 */
export class SecondBrainPanel extends BasePanel {
	id = "secondbrain";
	title = "Second Brain";
	private query = "";

	private get store(): SecondBrainStore {
		return this.ctx.plugin.secondBrain;
	}

	protected async renderBody(): Promise<void> {
		const head = placard(this.el, "Second Brain");
		const notes = this.store.listNotes();
		head.createSpan({ cls: "mrd-placard-badge", text: `${notes.length} active` });

		// --- actions ---
		const actions = this.el.createDiv({ cls: "mrd-btn-row" });
		this.btn(actions, "+ Note", "mrd-btn-primary", () =>
			new NewNoteModal(this.ctx.app, this.store, () => this.rerender()).open()
		);
		this.btn(actions, "+ Category", "", () =>
			new NewCategoryModal(this.ctx.app, this.store, () => this.rerender()).open()
		);
		this.btn(actions, "Assign to category", "", () => this.startAssign());

		// --- search ---
		const input = this.el.createEl("input", {
			cls: "mrd-search-input",
			attr: { type: "search", placeholder: "Search the Second Brain…" },
		});
		input.value = this.query;
		const results = this.el.createDiv({ cls: "mrd-sb-results" });
		const renderResults = () => {
			results.empty();
			const q = this.query.trim();
			const list = q ? this.fuzzy(notes, q) : notes.slice(0, 12);
			if (list.length === 0) {
				results.createDiv({ cls: "mrd-muted", text: q ? "No matches." : "No active notes yet." });
				return;
			}
			for (const file of list) this.renderNoteRow(results, file);
			if (!q && notes.length > 12) {
				results.createDiv({ cls: "mrd-muted", text: `+${notes.length - 12} more — type to search.` });
			}
		};
		input.addEventListener("input", () => {
			this.query = input.value;
			renderResults();
		});
		renderResults();

		// --- categories ---
		const cats = this.store.listCategories();
		const catSection = this.el.createDiv({ cls: "mrd-sb-cats" });
		catSection.createDiv({ cls: "mrd-subhead", text: `Categories · ${cats.length}` });
		if (cats.length === 0) {
			catSection.createDiv({ cls: "mrd-muted", text: "No categories yet. Create one to start organizing." });
		}
		for (const cat of cats) {
			const details = catSection.createEl("details", { cls: "mrd-sb-cat" });
			const summary = details.createEl("summary");
			summary.createSpan({ cls: "mrd-sb-cat-name", text: cat.name });
			const count = summary.createSpan({ cls: "mrd-chip mrd-chip-cold", text: "…" });
			details.addEventListener(
				"toggle",
				async () => {
					if (!details.open) return;
					const members = await this.store.categoryMembers(cat.file);
					count.setText(String(members.length));
					const body = details.querySelector(".mrd-sb-cat-body") ?? details.createDiv({ cls: "mrd-sb-cat-body" });
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
				},
				{ once: false }
			);
		}

		// --- archived ---
		const archived = this.store.listArchived();
		if (archived.length > 0) {
			const arch = this.el.createEl("details", { cls: "mrd-sb-archived" });
			arch.createEl("summary", { text: `Archive · ${archived.length}` });
			const list = arch.createDiv();
			for (const file of archived) {
				const row = list.createDiv({ cls: "mrd-sb-member" });
				const link = row.createEl("a", { cls: "mrd-sb-link", text: file.basename });
				link.addEventListener("click", (e) => {
					e.preventDefault();
					void this.ctx.app.workspace.getLeaf(false).openFile(file);
				});
				const restore = row.createEl("button", { cls: "mrd-icon-btn mrd-sb-icon", text: "⤺", attr: { title: "Restore" } });
				restore.addEventListener("click", async () => {
					await this.store.restoreNote(file);
					new Notice(`Restored ${file.basename}.`);
					this.rerender();
				});
			}
		}
	}

	private renderNoteRow(parent: HTMLElement, file: TFile): void {
		const row = parent.createDiv({ cls: "mrd-sb-row" });
		const link = row.createEl("a", { cls: "mrd-sb-link", text: file.basename });
		link.addEventListener("click", (e) => {
			e.preventDefault();
			void this.ctx.app.workspace.getLeaf(false).openFile(file);
		});
		const archive = row.createEl("button", { cls: "mrd-icon-btn mrd-sb-icon", text: "🗄", attr: { title: "Archive" } });
		archive.addEventListener("click", async () => {
			await this.store.archiveNote(file);
			new Notice(`Archived ${file.basename}.`);
			this.rerender();
		});
	}

	private startAssign(): void {
		const notes = this.store.listNotes();
		if (notes.length === 0) {
			new Notice("No notes to assign yet.");
			return;
		}
		new NoteSuggestModal(this.ctx.app, notes, (note) => {
			const cats = this.store.listCategories().map((c) => c.name);
			new CategoryPromptModal(this.ctx.app, cats, async (category) => {
				await this.store.assign(note, category);
				new Notice(`Assigned ${note.basename} to ${category}.`);
				this.rerender();
			}).open();
		}).open();
	}

	private fuzzy(files: TFile[], query: string): TFile[] {
		const search = prepareFuzzySearch(query);
		const scored: Array<{ file: TFile; score: number }> = [];
		for (const file of files) {
			let best = search(file.basename);
			const cache = this.ctx.app.metadataCache.getFileCache(file);
			for (const h of cache?.headings ?? []) {
				const r = search(h.heading);
				if (r && (!best || r.score > best.score)) best = r;
			}
			if (best) scored.push({ file, score: best.score });
		}
		return scored.sort((a, b) => b.score - a.score).slice(0, 20).map((s) => s.file);
	}

	private btn(parent: HTMLElement, label: string, cls: string, onClick: () => void): void {
		const b = parent.createEl("button", { cls: `mrd-btn ${cls}`.trim(), text: label });
		b.addEventListener("click", onClick);
	}
}

// --------------------------------------------------------------- modals

class NewNoteModal extends Modal {
	private title = "";
	private category = "";
	constructor(app: App, private store: SecondBrainStore, private onDone: () => void) {
		super(app);
	}
	onOpen(): void {
		this.titleEl.setText("New Second Brain note");
		const cats = this.store.listCategories().map((c) => c.name);
		new Setting(this.contentEl).setName("Title").addText((t) => {
			t.setPlaceholder("Note title").onChange((v) => (this.title = v));
			t.inputEl.focus();
			t.inputEl.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					e.preventDefault();
					void this.submit();
				}
			});
		});
		new Setting(this.contentEl).setName("Category").setDesc("Optional — assign on creation.").addDropdown((dd) => {
			dd.addOption("", "(none)");
			for (const c of cats) dd.addOption(c, c);
			dd.onChange((v) => (this.category = v));
		});
		new Setting(this.contentEl)
			.addButton((b) => b.setButtonText("Cancel").onClick(() => this.close()))
			.addButton((b) => b.setButtonText("Create").setCta().onClick(() => void this.submit()));
	}
	private async submit(): Promise<void> {
		const title = this.title.trim();
		if (!title) {
			new Notice("A note needs a title.");
			return;
		}
		const file = await this.store.createNote(title, this.category || undefined);
		this.close();
		this.onDone();
		await this.app.workspace.getLeaf(false).openFile(file);
	}
	onClose(): void {
		this.contentEl.empty();
	}
}

class NewCategoryModal extends Modal {
	private name = "";
	constructor(app: App, private store: SecondBrainStore, private onDone: () => void) {
		super(app);
	}
	onOpen(): void {
		this.titleEl.setText("New category");
		new Setting(this.contentEl).setName("Name").addText((t) => {
			t.setPlaceholder("Category name").onChange((v) => (this.name = v));
			t.inputEl.focus();
			t.inputEl.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					e.preventDefault();
					void this.submit();
				}
			});
		});
		new Setting(this.contentEl)
			.addButton((b) => b.setButtonText("Cancel").onClick(() => this.close()))
			.addButton((b) => b.setButtonText("Create").setCta().onClick(() => void this.submit()));
	}
	private async submit(): Promise<void> {
		const name = this.name.trim();
		if (!name) {
			new Notice("A category needs a name.");
			return;
		}
		await this.store.createCategory(name);
		this.close();
		this.onDone();
	}
	onClose(): void {
		this.contentEl.empty();
	}
}

class NoteSuggestModal extends FuzzySuggestModal<TFile> {
	constructor(app: App, private notes: TFile[], private onChoose: (file: TFile) => void) {
		super(app);
		this.setPlaceholder("Pick a note to assign…");
	}
	getItems(): TFile[] {
		return this.notes;
	}
	getItemText(file: TFile): string {
		return file.basename;
	}
	onChooseItem(file: TFile): void {
		this.onChoose(file);
	}
}

/** Pick an existing category from a dropdown, or type a new one. */
class CategoryPromptModal extends Modal {
	private picked = "";
	private newName = "";
	constructor(app: App, private categories: string[], private onChoose: (category: string) => void) {
		super(app);
	}
	onOpen(): void {
		this.titleEl.setText("Assign to category");
		this.picked = this.categories[0] ?? "";
		if (this.categories.length > 0) {
			new Setting(this.contentEl).setName("Existing category").addDropdown((dd) => {
				for (const c of this.categories) dd.addOption(c, c);
				dd.setValue(this.picked).onChange((v) => (this.picked = v));
			});
		}
		new Setting(this.contentEl)
			.setName("Or a new category")
			.setDesc("Leave blank to use the one above.")
			.addText((t) => {
				t.setPlaceholder("New category name").onChange((v) => (this.newName = v));
				if (this.categories.length === 0) t.inputEl.focus();
				t.inputEl.addEventListener("keydown", (e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						this.submit();
					}
				});
			});
		new Setting(this.contentEl)
			.addButton((b) => b.setButtonText("Cancel").onClick(() => this.close()))
			.addButton((b) => b.setButtonText("Assign").setCta().onClick(() => this.submit()));
	}
	private submit(): void {
		const category = this.newName.trim() || this.picked.trim();
		if (!category) {
			new Notice("Pick or name a category.");
			return;
		}
		this.close();
		this.onChoose(category);
	}
	onClose(): void {
		this.contentEl.empty();
	}
}

import { App, TFile, TFolder, normalizePath } from "obsidian";

/**
 * Second Brain manager — the ongoing-project library (distinct from the
 * Knowledge Base information library). Handles searching the Second Brain
 * folder, archiving notes into its Archive subfolder, and category management:
 * category membership is tracked *both* ways (a `[[wikilink]]` in the category
 * note's list AND a `categories:` frontmatter entry on the note), and the
 * category note's list is kept alphabetized under a configurable heading.
 */

export interface SecondBrainConfig {
	root: string;
	categoriesSubfolder: string;
	archiveSubfolder: string;
	listHeading: string;
}

export interface CategoryInfo {
	name: string;
	file: TFile;
	members: string[]; // wikilink targets, alphabetized
}

export class SecondBrainStore {
	constructor(private app: App, private cfg: () => SecondBrainConfig) {}

	root(): string {
		return normalizePath((this.cfg().root || "Second Brain").replace(/\/+$/, ""));
	}
	categoriesFolder(): string {
		return normalizePath(this.root() + "/" + (this.cfg().categoriesSubfolder || "Categories"));
	}
	archiveFolder(): string {
		return normalizePath(this.root() + "/" + (this.cfg().archiveSubfolder || "Archive"));
	}
	private heading(): string {
		return (this.cfg().listHeading || "Notes").trim();
	}

	private inFolder(file: TFile, folder: string): boolean {
		return file.path === folder || file.path.startsWith(folder + "/");
	}

	/** Active notes: everything under the root except the Archive and Categories
	 * subfolders. */
	listNotes(): TFile[] {
		const root = this.root();
		const cats = this.categoriesFolder();
		const arch = this.archiveFolder();
		return this.app.vault
			.getMarkdownFiles()
			.filter(
				(f) =>
					this.inFolder(f, root) && !this.inFolder(f, cats) && !this.inFolder(f, arch)
			)
			.sort((a, b) => a.basename.localeCompare(b.basename));
	}

	listArchived(): TFile[] {
		const arch = this.archiveFolder();
		return this.app.vault
			.getMarkdownFiles()
			.filter((f) => this.inFolder(f, arch))
			.sort((a, b) => a.basename.localeCompare(b.basename));
	}

	listCategories(): CategoryInfo[] {
		const cats = this.categoriesFolder();
		return this.app.vault
			.getMarkdownFiles()
			.filter((f) => this.inFolder(f, cats))
			.map((file) => ({ name: file.basename, file, members: [] as string[] }))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	async categoryMembers(file: TFile): Promise<string[]> {
		const content = await this.app.vault.cachedRead(file);
		return this.parseMembers(content);
	}

	// ----------------------------------------------------------- mutations

	private async ensureFolder(path: string): Promise<void> {
		const norm = normalizePath(path);
		if (!norm || norm === "/") return;
		if (this.app.vault.getAbstractFileByPath(norm) instanceof TFolder) return;
		// create parents as needed
		const parts = norm.split("/");
		let cur = "";
		for (const p of parts) {
			cur = cur ? cur + "/" + p : p;
			if (!(this.app.vault.getAbstractFileByPath(cur) instanceof TFolder)) {
				await this.app.vault.createFolder(cur).catch(() => {});
			}
		}
	}

	private sanitize(name: string): string {
		return name.replace(/[\\/:*?"<>|#^[\]]/g, "-").trim();
	}

	private uniquePath(folder: string, base: string): string {
		let name = base;
		for (let i = 1; i < 1000; i++) {
			const path = normalizePath(`${folder}/${name}.md`);
			if (!this.app.vault.getAbstractFileByPath(path)) return path;
			name = `${base} ${i + 1}`;
		}
		return normalizePath(`${folder}/${base} ${Date.now()}.md`);
	}

	/** Create a category note (with the list heading) if it doesn't exist. */
	async createCategory(name: string): Promise<TFile> {
		const clean = this.sanitize(name);
		await this.ensureFolder(this.categoriesFolder());
		const existing = this.app.vault.getAbstractFileByPath(
			normalizePath(`${this.categoriesFolder()}/${clean}.md`)
		);
		if (existing instanceof TFile) return existing;
		const body = `---\ntype: category\n---\n\n# ${clean}\n\n## ${this.heading()}\n`;
		const path = this.uniquePath(this.categoriesFolder(), clean);
		return this.app.vault.create(path, body);
	}

	/** Create a note in the Second Brain root, optionally assigning a category. */
	async createNote(title: string, category?: string): Promise<TFile> {
		const clean = this.sanitize(title);
		await this.ensureFolder(this.root());
		const path = this.uniquePath(this.root(), clean);
		const file = await this.app.vault.create(path, `# ${clean}\n\n`);
		if (category) await this.assign(file, category);
		return file;
	}

	/** Assign `file` to `category`: write the frontmatter entry AND the
	 * alphabetized wikilink in the category note (creating it if needed). */
	async assign(file: TFile, category: string): Promise<void> {
		const catFile = await this.createCategory(category);
		// frontmatter side
		await this.app.fileManager.processFrontMatter(file, (fm) => {
			const list: string[] = Array.isArray(fm.categories)
				? fm.categories.map(String)
				: fm.categories
				? [String(fm.categories)]
				: [];
			if (!list.includes(catFile.basename)) list.push(catFile.basename);
			fm.categories = list;
		});
		// wikilink side
		await this.addMember(catFile, file.basename);
	}

	async unassign(file: TFile, category: string): Promise<void> {
		const catFile = this.app.vault.getAbstractFileByPath(
			normalizePath(`${this.categoriesFolder()}/${this.sanitize(category)}.md`)
		);
		if (catFile instanceof TFile) await this.removeMember(catFile, file.basename);
		await this.app.fileManager.processFrontMatter(file, (fm) => {
			if (Array.isArray(fm.categories)) {
				fm.categories = fm.categories.map(String).filter((c: string) => c !== category);
			} else if (fm.categories === category) {
				delete fm.categories;
			}
		});
	}

	/** Archive a note: remove it from every category list, then move it into the
	 * Archive subfolder (inbound links elsewhere are repointed by Obsidian). */
	async archiveNote(file: TFile): Promise<void> {
		for (const cat of this.listCategories()) {
			await this.removeMember(cat.file, file.basename);
		}
		await this.ensureFolder(this.archiveFolder());
		let dest = normalizePath(`${this.archiveFolder()}/${file.name}`);
		if (this.app.vault.getAbstractFileByPath(dest)) {
			dest = this.uniquePath(this.archiveFolder(), file.basename);
		}
		await this.app.fileManager.renameFile(file, dest);
		await this.app.fileManager.processFrontMatter(file, (fm) => {
			fm.archived = true;
		});
	}

	async restoreNote(file: TFile): Promise<void> {
		await this.ensureFolder(this.root());
		let dest = normalizePath(`${this.root()}/${file.name}`);
		if (this.app.vault.getAbstractFileByPath(dest)) {
			dest = this.uniquePath(this.root(), file.basename);
		}
		await this.app.fileManager.renameFile(file, dest);
		await this.app.fileManager.processFrontMatter(file, (fm) => {
			delete fm.archived;
		});
	}

	// -------------------------------------------------- category list I/O

	private headingRe(): RegExp {
		const esc = this.heading().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		return new RegExp(`^#{1,6}\\s+${esc}:?\\s*$`, "i");
	}

	private parseMembers(content: string): string[] {
		const lines = content.split("\n");
		const start = lines.findIndex((l) => this.headingRe().test(l));
		if (start === -1) return [];
		const out: string[] = [];
		for (let i = start + 1; i < lines.length; i++) {
			if (/^#{1,6}\s/.test(lines[i])) break;
			const m = lines[i].match(/^\s*-\s+\[\[([^\]|]+)(?:\|[^\]]+)?\]\]\s*$/);
			if (m) out.push(m[1].trim());
		}
		return out;
	}

	private async writeMembers(file: TFile, members: string[]): Promise<void> {
		const sorted = [...new Set(members)].sort((a, b) =>
			a.localeCompare(b, undefined, { sensitivity: "base" })
		);
		await this.app.vault.process(file, (content) => {
			const lines = content.split("\n");
			let start = lines.findIndex((l) => this.headingRe().test(l));
			if (start === -1) {
				// no heading yet — append one
				const trimmed = content.replace(/\n+$/, "");
				const block = [`## ${this.heading()}`, "", ...sorted.map((m) => `- [[${m}]]`)].join("\n");
				return (trimmed ? trimmed + "\n\n" : "") + block + "\n";
			}
			// find the end of the section (next heading or EOF)
			let end = lines.length;
			for (let i = start + 1; i < lines.length; i++) {
				if (/^#{1,6}\s/.test(lines[i])) {
					end = i;
					break;
				}
			}
			const block = ["", ...sorted.map((m) => `- [[${m}]]`), ""];
			lines.splice(start + 1, end - (start + 1), ...block);
			return lines.join("\n");
		});
	}

	private async addMember(file: TFile, basename: string): Promise<void> {
		const members = await this.categoryMembers(file);
		if (members.includes(basename)) return;
		members.push(basename);
		await this.writeMembers(file, members);
	}

	private async removeMember(file: TFile, basename: string): Promise<void> {
		const members = await this.categoryMembers(file);
		if (!members.includes(basename)) return;
		await this.writeMembers(
			file,
			members.filter((m) => m !== basename)
		);
	}
}

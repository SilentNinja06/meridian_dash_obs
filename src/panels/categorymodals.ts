import { App, FuzzySuggestModal, Modal, Notice, Setting, TFile } from "obsidian";
import { LibraryStore } from "../core/library";

/** Create a new category note in a library. */
export class NewCategoryModal extends Modal {
	private name = "";
	constructor(app: App, private store: LibraryStore, private onDone: () => void) {
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

/** Assign flow: pick a note, then pick/type a category, then assign. */
export function runAssignFlow(app: App, store: LibraryStore, onDone: () => void): void {
	const notes = store.listNotes();
	if (notes.length === 0) {
		new Notice("No notes to assign yet.");
		return;
	}
	new NoteSuggestModal(app, notes, (note) => {
		const cats = store.listCategories().map((c) => c.name);
		new CategoryPromptModal(app, cats, async (category) => {
			await store.assign(note, category);
			new Notice(`Assigned ${note.basename} to ${category}.`);
			onDone();
		}).open();
	}).open();
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

import { App, TFile, TFolder, normalizePath } from "obsidian";
import { TodoItem } from "./todostore";

/**
 * Persistence for the Directives list as a **vault file** rather than plugin
 * `data.json`.
 *
 * Why: the to-do list is the one piece of dashboard state the Operator edits on
 * both the phone and the desktop, so it has to sync. Obsidian Sync is built to
 * propagate *vault files*; it treats a plugin's `data.json` as configuration
 * that only syncs when "installed community plugins" is enabled, with coarse
 * last-write-wins and no per-item merge — which is why the checklists weren't
 * crossing devices. A plain JSON file in the vault syncs like any note, and we
 * reload it live when the other device's copy lands.
 */
interface DirectivesFile {
	version: number;
	todos: TodoItem[];
}

const DEFAULT_PATH = "MERIDIAN/Directives.json";

export class DirectivesStore {
	private items: TodoItem[] = [];
	/** The exact text we last read from / wrote to disk, so a modify event
	 * caused by our own write reloads to identical content and is ignored. */
	private lastSerialized = "";

	constructor(private app: App, private getPath: () => string) {}

	getItems(): TodoItem[] {
		return this.items;
	}

	setItems(items: TodoItem[]): void {
		this.items = items;
	}

	path(): string {
		return normalizePath(this.getPath() || DEFAULT_PATH);
	}

	isDirectivesPath(path: string): boolean {
		return normalizePath(path) === this.path();
	}

	/** Load from the vault file. Returns true if the file existed. */
	async load(): Promise<boolean> {
		const file = this.app.vault.getAbstractFileByPath(this.path());
		if (!(file instanceof TFile)) return false;
		try {
			const raw = await this.app.vault.read(file);
			this.lastSerialized = raw;
			const parsed = JSON.parse(raw) as DirectivesFile;
			this.items = Array.isArray(parsed?.todos) ? parsed.todos : [];
		} catch (e) {
			console.error("MERIDIAN: could not read the directives file", e);
		}
		return true;
	}

	/** Write the current list to the vault file (creating it and its folder if
	 * needed). No-op when the content is unchanged. */
	async save(): Promise<void> {
		const body = JSON.stringify({ version: 1, todos: this.items } as DirectivesFile, null, 2) + "\n";
		if (body === this.lastSerialized) return;
		this.lastSerialized = body;
		const path = this.path();
		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing instanceof TFile) {
			await this.app.vault.modify(existing, body);
		} else {
			await this.ensureFolder(path);
			await this.app.vault.create(path, body);
		}
	}

	/** React to a vault change on the directives file (e.g. Obsidian Sync landing
	 * the other device's edit). Returns true if the in-memory list actually
	 * changed — our own writes reload to identical content and return false. */
	async onExternalChange(path: string): Promise<boolean> {
		if (!this.isDirectivesPath(path)) return false;
		const before = this.lastSerialized;
		await this.load();
		return this.lastSerialized !== before;
	}

	private async ensureFolder(path: string): Promise<void> {
		const dir = path.split("/").slice(0, -1).join("/");
		if (!dir) return;
		if (this.app.vault.getAbstractFileByPath(dir) instanceof TFolder) return;
		await this.app.vault.createFolder(dir).catch(() => {});
	}
}

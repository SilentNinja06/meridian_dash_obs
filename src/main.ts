import { Plugin, WorkspaceLeaf } from "obsidian";
import {
	DEFAULT_SETTINGS,
	MeridianData,
	MeridianSettings,
	MeridianSettingTab,
	mergeSettings,
} from "./settings";
import { Bridge } from "./core/bridge";
import { TodoStore, seedTodos } from "./core/todostore";
import { DirectivesStore } from "./core/directivesstore";
import { LibraryStore } from "./core/library";
import { MeridianRuntime, RefreshReason } from "./panels/types";
import { MeridianView, VIEW_TYPE_MERIDIAN } from "./view";

export default class MeridianDashPlugin extends Plugin {
	settings: MeridianSettings = DEFAULT_SETTINGS;
	bridge!: Bridge;
	todos!: TodoStore;
	directives!: DirectivesStore;
	secondBrain!: LibraryStore;
	knowledgeBase!: LibraryStore;
	runtime: MeridianRuntime = {
		sessionStart: Date.now(),
		previousAccess: Date.now(),
		recentLines: [],
		foodFocusUntil: 0,
	};

	private data!: MeridianData;
	private refreshTimer: number | null = null;

	async onload(): Promise<void> {
		await this.load_();

		this.bridge = new Bridge(this.app);
		this.secondBrain = new LibraryStore(this.app, () => ({
			root: this.settings.secondBrainPath,
			categoriesSubfolder: this.settings.secondBrainCategoriesSubfolder,
			archiveSubfolder: this.settings.secondBrainArchiveSubfolder,
			listHeading: this.settings.secondBrainListHeading,
		}));
		this.knowledgeBase = new LibraryStore(this.app, () => ({
			root: this.settings.kbRootPath,
			notesSubfolder: this.settings.kbNotesSubfolder,
			categoriesSubfolder: this.settings.kbCategoriesSubfolder,
			archiveSubfolder: this.settings.kbArchiveSubfolder,
			listHeading: this.settings.kbListHeading,
		}));
		this.directives = new DirectivesStore(this.app, () => this.settings.directivesPath);
		await this.loadDirectives();
		this.todos = new TodoStore(
			this.app,
			() => this.directives.getItems(),
			(items) => this.directives.setItems(items),
			() => this.directives.save(),
			() => ({
				marker: this.settings.completedTasksMarker,
				heading: this.settings.completedTasksHeading,
			})
		);

		this.registerView(VIEW_TYPE_MERIDIAN, (leaf) => new MeridianView(leaf, this));

		this.addRibbonIcon("radar", "Open MERIDIAN dashboard", () => void this.openDashboard());

		this.addCommand({
			id: "open-dashboard",
			name: "Open dashboard",
			callback: () => void this.openDashboard(),
		});

		this.addSettingTab(new MeridianSettingTab(this.app, this));

		// Refresh bus source: vault/metadata changes, debounced ~300ms (§4).
		this.registerEvent(this.app.metadataCache.on("changed", () => this.scheduleRefresh()));
		this.registerEvent(this.app.vault.on("modify", (file) => this.onVaultChange(file.path)));
		this.registerEvent(this.app.vault.on("create", (file) => this.onVaultChange(file.path)));
		this.registerEvent(this.app.vault.on("delete", () => this.scheduleRefresh()));
		this.registerEvent(this.app.vault.on("rename", () => this.scheduleRefresh()));

		if (this.settings.openOnStartup) {
			this.app.workspace.onLayoutReady(() => void this.openDashboard(false));
		}
	}

	onunload(): void {
		if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
	}

	// ------------------------------------------------------------- data

	private async load_(): Promise<void> {
		const raw = (await this.loadData()) as Partial<MeridianData> | null;
		this.settings = mergeSettings(raw?.settings);
		this.data = {
			settings: this.settings,
			// Legacy home of the to-do list; kept only for one-time migration to the
			// vault-backed directives file (see loadDirectives).
			todos: raw?.todos ?? [],
			lastAccess: raw?.lastAccess ?? Date.now(),
			seeded: raw?.seeded ?? false,
			agendaCache: raw?.agendaCache ?? {},
			milestoneShownDate: raw?.milestoneShownDate ?? "",
		};
		this.runtime.previousAccess = this.data.lastAccess;
		await this.saveData_();
	}

	/** Load directives from the vault file, migrating from the old plugin-data
	 * location (or the seed defaults) the first time. */
	private async loadDirectives(): Promise<void> {
		const existed = await this.directives.load();
		if (existed) {
			this.data.seeded = true;
			return;
		}
		// No vault file yet: migrate legacy plugin-data todos, else seed.
		const legacy = this.data.todos ?? [];
		this.directives.setItems(legacy.length > 0 || this.data.seeded ? legacy : seedTodos());
		this.data.seeded = true;
		this.data.todos = [];
		await this.directives.save();
		await this.saveData_();
	}

	/** Vault create/modify router: reload directives when their file changes on
	 * another device (Obsidian Sync), otherwise a plain debounced refresh. */
	private onVaultChange(path: string): void {
		if (this.directives.isDirectivesPath(path)) {
			void this.directives.onExternalChange(path).then((changed) => {
				if (changed) this.refreshOpenViews("vault");
			});
			return;
		}
		this.scheduleRefresh();
	}

	async saveData_(): Promise<void> {
		this.data.settings = this.settings;
		await this.saveData(this.data);
	}

	// Accessors panels use for the persisted, non-settings blobs.
	get agendaCache(): Record<string, { text: string; fetchedAt: number }> {
		return this.data.agendaCache;
	}

	get milestoneShownDate(): string {
		return this.data.milestoneShownDate;
	}

	set milestoneShownDate(date: string) {
		this.data.milestoneShownDate = date;
	}

	/** Record this view-open as the latest access, returning the prior value. */
	touchAccess(): number {
		const prior = this.data.lastAccess;
		this.data.lastAccess = Date.now();
		this.runtime.previousAccess = prior;
		this.runtime.sessionStart = Date.now();
		void this.saveData_();
		return prior;
	}

	markFoodFocus(): void {
		this.runtime.foodFocusUntil = Date.now() + 4 * 60 * 1000;
	}

	// ------------------------------------------------------------- view

	async openDashboard(reveal = true): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_MERIDIAN);
		let leaf: WorkspaceLeaf;
		if (existing.length > 0) {
			leaf = existing[0];
		} else {
			// Prefer replacing an empty new-tab leaf on startup; else a fresh tab.
			leaf = reveal ? this.app.workspace.getLeaf(true) : this.app.workspace.getLeaf(false);
			await leaf.setViewState({ type: VIEW_TYPE_MERIDIAN, active: reveal });
		}
		if (reveal) this.app.workspace.revealLeaf(leaf);
	}

	refreshOpenViews(reason: RefreshReason = "manual"): void {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MERIDIAN)) {
			const view = leaf.view;
			if (view instanceof MeridianView) void view.refreshPanels(reason);
		}
	}

	/** Re-mount panels in every open view — for panel enable/reorder changes. */
	rebuildOpenViews(): void {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MERIDIAN)) {
			const view = leaf.view;
			if (view instanceof MeridianView) void view.rebuild();
		}
	}

	private scheduleRefresh(): void {
		if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
		this.refreshTimer = window.setTimeout(() => {
			this.refreshTimer = null;
			this.refreshOpenViews("vault");
		}, 300);
	}
}

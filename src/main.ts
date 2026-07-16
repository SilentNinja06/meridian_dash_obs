import { Plugin, WorkspaceLeaf } from "obsidian";
import {
	DEFAULT_SETTINGS,
	MeridianData,
	MeridianSettings,
	MeridianSettingTab,
	mergeSettings,
} from "./settings";
import { Bridge } from "./core/bridge";
import { TodoItem, TodoStore, seedTodos } from "./core/todostore";
import { MeridianRuntime, RefreshReason } from "./panels/types";
import { MeridianView, VIEW_TYPE_MERIDIAN } from "./view";

export default class MeridianDashPlugin extends Plugin {
	settings: MeridianSettings = DEFAULT_SETTINGS;
	bridge!: Bridge;
	todos!: TodoStore;
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
		this.todos = new TodoStore(
			this.app,
			() => this.data.todos,
			(items: TodoItem[]) => {
				this.data.todos = items;
			},
			() => this.saveData_(),
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
		this.registerEvent(this.app.vault.on("modify", () => this.scheduleRefresh()));
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
			todos: raw?.todos ?? [],
			lastAccess: raw?.lastAccess ?? Date.now(),
			seeded: raw?.seeded ?? false,
			agendaCache: raw?.agendaCache ?? {},
			milestoneShownDate: raw?.milestoneShownDate ?? "",
		};
		if (!this.data.seeded && this.data.todos.length === 0) {
			this.data.todos = seedTodos();
			this.data.seeded = true;
		}
		this.runtime.previousAccess = this.data.lastAccess;
		await this.saveData_();
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

	private scheduleRefresh(): void {
		if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
		this.refreshTimer = window.setTimeout(() => {
			this.refreshTimer = null;
			this.refreshOpenViews("vault");
		}, 300);
	}
}

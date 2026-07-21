import { Notice, ObsidianProtocolData, Plugin, WorkspaceLeaf, moment } from "obsidian";
import {
	DEFAULT_SETTINGS,
	LineHistoryEntry,
	MeridianData,
	MeridianSettings,
	MeridianSettingTab,
	WeeklyGoal,
	mergeSettings,
} from "./settings";
import { Bridge } from "./core/bridge";
import { TodoStore } from "dash-core";
import { seedTodos, DIRECTIVES_HEADER } from "./seed";
import { DirectivesStore } from "dash-core";
import { LibraryStore } from "dash-core";
import { appendToDailyField, getDailyNoteFile, headingField, readDailyNoteRaw, readField, readMarkerLogLines } from "dash-core";
import { LOG_FIELD_LABELS, LOG_FIELD_SPECS, LOG_FIELDS, LogField, isLogField } from "./core/dailyfields";
import { LocalEvent } from "dash-core";
import { DEFAULT_STREAK, StreakData, currentStreakFromDays } from "dash-core";
import { MeridianRuntime, RefreshReason } from "./panels/types";
import { MeridianView, VIEW_TYPE_MERIDIAN } from "./view";
import { TodoEditModal } from "./panels/todomodal";
import { PromptModal } from "./panels/promptmodal";
import { WeekReviewModal } from "./panels/weekreview";
import { LocalEventModal } from "./panels/localeventmodal";
import { LineHistoryModal } from "./panels/linehistory";
import { WeeklyGoalsModal, currentWeekKey } from "./panels/weeklygoals";
import { anyCanonLine } from "./panels/meridian";

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
		typingUntil: 0,
		streakRecordDate: "",
	};

	private data!: MeridianData;
	private refreshTimer: number | null = null;
	private midnightTimer: number | null = null;

	async onload(): Promise<void> {
		// Register the view synchronously, *before any await*, so a dashboard leaf
		// saved in the workspace can be deserialized on startup. If this ran after
		// an await (or after vault work that can reject early in startup), a cold
		// start would leave the view type unregistered and the restored leaf
		// broken until the plugin is re-enabled.
		this.registerView(VIEW_TYPE_MERIDIAN, (leaf) => new MeridianView(leaf, this));

		// Stores read settings lazily via closures, so they can be constructed
		// before settings finish loading — a restored view always finds them ready.
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
		this.directives = new DirectivesStore(this.app, () => this.settings.directivesPath, {
			header: DIRECTIVES_HEADER,
			defaultPath: "MERIDIAN/Directives.md",
		});
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

		// Plugin data only (no vault access) — safe during onload.
		await this.load_();

		this.addRibbonIcon("radar", "Open MERIDIAN dashboard", () => void this.openDashboard());
		this.addCommand({
			id: "open-dashboard",
			name: "Open dashboard",
			callback: () => void this.openDashboard(),
		});
		this.registerCommands();
		this.registerProtocol();
		this.addSettingTab(new MeridianSettingTab(this.app, this));

		// Refresh bus source: vault/metadata changes, debounced ~300ms (§4).
		this.registerEvent(this.app.metadataCache.on("changed", () => this.scheduleRefresh()));
		this.registerEvent(this.app.vault.on("modify", (file) => this.onVaultChange(file.path)));
		this.registerEvent(this.app.vault.on("create", (file) => this.onVaultChange(file.path)));
		this.registerEvent(this.app.vault.on("delete", () => this.scheduleRefresh()));
		this.registerEvent(this.app.vault.on("rename", () => this.scheduleRefresh()));

		// Everything that reads or writes the vault (loading/creating the
		// directives file) or touches the workspace waits until it is ready.
		this.app.workspace.onLayoutReady(() => {
			void this.loadDirectives().then(() => {
				void this.updateStreak();
				this.refreshOpenViews("vault");
			});
			this.scheduleMidnight();
			// Turn empty New Tab pages into the dashboard when that's enabled.
			this.registerEvent(
				this.app.workspace.on("active-leaf-change", (leaf) => this.maybeReplaceEmptyLeaf(leaf))
			);
			if (this.settings.replaceNewTab) this.replaceActiveEmptyLeaf();
			if (this.settings.openOnStartup) void this.openDashboard(false);
		});
	}

	/** If enabled, swap an empty New Tab leaf for the dashboard. */
	private maybeReplaceEmptyLeaf(leaf: WorkspaceLeaf | null): void {
		if (!this.settings.replaceNewTab || !leaf) return;
		if (leaf.view?.getViewType() === "empty") {
			void leaf.setViewState({ type: VIEW_TYPE_MERIDIAN });
		}
	}

	/** Replace the currently-active leaf if it's an empty New Tab. */
	replaceActiveEmptyLeaf(): void {
		this.maybeReplaceEmptyLeaf(this.app.workspace.activeLeaf ?? null);
	}

	onunload(): void {
		if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
		if (this.midnightTimer !== null) window.clearTimeout(this.midnightTimer);
	}

	// ----------------------------------------------- commands + URI (§1.1)

	/** Everything the dashboard does, reachable from the command palette / a
	 * mobile shortcut / a keybind — each works whether or not a leaf is open. */
	private registerCommands(): void {
		this.addCommand({
			id: "complete-next-directive",
			name: "Complete next directive",
			callback: () => void this.completeNextDirective(),
		});
		this.addCommand({
			id: "add-directive",
			name: "Add a directive",
			callback: () => new TodoEditModal(this.app, this.todos, undefined, () => this.refreshOpenViews("vault")).open(),
		});
		// id (Obsidian prefixes with `meridian-dash:`) → field
		const logCommands: Array<{ id: string; field: LogField }> = [
			{ id: "log-primary", field: "primary" },
			{ id: "log-supplemental", field: "supplemental" },
			{ id: "log-musing", field: "musing" },
			{ id: "reconsider-tomorrow", field: "reconsider" },
		];
		for (const { id, field } of logCommands) {
			this.addCommand({
				id,
				name: this.commandNameForField(field),
				callback: () => this.promptLog(field),
			});
		}
		this.addCommand({
			id: "new-meridian-line",
			name: "New MERIDIAN line",
			callback: () => this.newMeridianLine(),
		});
		this.addCommand({
			id: "line-history",
			name: "MERIDIAN line history",
			callback: () => new LineHistoryModal(this.app, this).open(),
		});
		this.addCommand({
			id: "add-event",
			name: "Add an event",
			callback: () => new LocalEventModal(this.app, this, undefined, () => this.refreshOpenViews("vault")).open(),
		});
		this.addCommand({
			id: "weekly-review",
			name: "Weekly review",
			callback: () => new WeekReviewModal(this.app, this).open(),
		});
		this.addCommand({
			id: "weekly-goals",
			name: "Set weekly goals",
			callback: () => new WeeklyGoalsModal(this.app, this, currentWeekKey(), () => this.refreshOpenViews("vault")).open(),
		});
		this.addCommand({
			id: "refresh",
			name: "Refresh dashboard",
			callback: () => this.refreshOpenViews("manual"),
		});
	}

	private commandNameForField(field: LogField): string {
		switch (field) {
			case "primary":
				return "Log to Daily log — Primary";
			case "supplemental":
				return "Log to Daily log — Supplemental";
			case "musing":
				return "Log a musing";
			case "reconsider":
				return "Log to Reconsider tomorrow";
		}
	}

	private registerProtocol(): void {
		this.registerObsidianProtocolHandler("meridian-dash", (params) => void this.handleUri(params));
	}

	/** Complete the top pending, non-skipped instance for today — the same code
	 * path as tapping it, so it archives under `# Completed tasks`. */
	private async completeNextDirective(): Promise<void> {
		const inst = this.todos.firstPending();
		if (!inst) {
			new Notice("Nothing pending. The queue is already clear.");
			return;
		}
		await this.todos.toggleComplete(inst.item.id);
		this.refreshOpenViews("vault");
		new Notice(`Directive completed: ${inst.item.text}. The record is updated.`);
	}

	private promptLog(field: LogField): void {
		new PromptModal(
			this.app,
			{ title: LOG_FIELD_LABELS[field], placeholder: "What to record", cta: "Log", multiline: true },
			(text) => void this.logToField(field, text)
		).open();
	}

	/** Append `text` to a daily-note field, refresh, confirm in voice. */
	private async logToField(field: LogField, text: string): Promise<void> {
		try {
			const wrote = await appendToDailyField(this.app, LOG_FIELD_SPECS[field], text);
			if (wrote) {
				this.refreshOpenViews("vault");
				new Notice(`Recorded to ${LOG_FIELD_LABELS[field]}. The record is updated.`);
			} else {
				new Notice(`The ${LOG_FIELD_LABELS[field]} section is not present in today's note. Nothing was written.`);
			}
		} catch (e) {
			console.error("MERIDIAN: log-to-field failed", e);
			new Notice("The record could not be written. The condition has been logged.");
		}
	}

	private newMeridianLine(): void {
		let rotated = false;
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_MERIDIAN)) {
			const view = leaf.view;
			if (view instanceof MeridianView && view.rotateMeridian()) rotated = true;
		}
		if (!rotated) new Notice(anyCanonLine());
	}

	/** URI action surface (§1.1). Headless with `text`; falls back to the modal
	 * without it. Every write goes through the same daily-note writer / store. */
	private async handleUri(params: ObsidianProtocolData): Promise<void> {
		const action = (params.action ?? "").toLowerCase();
		switch (action) {
			case "":
			case "open":
				await this.openDashboard();
				return;
			case "complete-next":
				await this.completeNextDirective();
				return;
			case "add-directive": {
				const text = (params.text ?? "").trim();
				if (text) {
					await this.todos.add({ text });
					this.refreshOpenViews("vault");
					new Notice(`Directive filed: ${text}.`);
				} else {
					new TodoEditModal(this.app, this.todos, undefined, () => this.refreshOpenViews("vault")).open();
				}
				return;
			}
			case "log": {
				const field = (params.field ?? "").toLowerCase();
				if (!isLogField(field)) {
					new Notice("That field is not on record. Nothing was written.");
					return;
				}
				const text = (params.text ?? "").trim();
				if (text) await this.logToField(field, text);
				else this.promptLog(field);
				return;
			}
			case "add-event": {
				const summary = (params.summary ?? params.text ?? "").trim();
				if (summary) {
					const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date : moment().format("YYYY-MM-DD");
					const start = params.start || undefined;
					await this.addLocalEvent({ summary, date, start, end: start && params.end ? params.end : undefined });
					new Notice(`Event filed: ${summary}.`);
				} else {
					new LocalEventModal(this.app, this, undefined, () => this.refreshOpenViews("vault")).open();
				}
				return;
			}
			default:
				new Notice("That instruction is not recognised. Nothing was done.");
		}
	}

	// ------------------------------------------------------------- data

	private async load_(): Promise<void> {
		const raw = (await this.loadData()) as Partial<MeridianData> | null;
		this.settings = mergeSettings(raw?.settings);
		// Directives moved from a `.json` vault file to `.md` (Obsidian Sync only
		// syncs `.json` with an opt-in setting; Markdown always syncs). Coerce any
		// saved `.json` path so the setting UI and file match.
		if (/\.json$/i.test(this.settings.directivesPath)) {
			this.settings.directivesPath = this.settings.directivesPath.replace(/\.json$/i, ".md");
		}
		this.data = {
			settings: this.settings,
			// Legacy home of the to-do list; kept only for one-time migration to the
			// vault-backed directives file (see loadDirectives).
			todos: raw?.todos ?? [],
			lastAccess: raw?.lastAccess ?? Date.now(),
			seeded: raw?.seeded ?? false,
			agendaCache: raw?.agendaCache ?? {},
			milestoneShownDate: raw?.milestoneShownDate ?? "",
			// New in 1.9.0/1.10.0 — every field optional with a safe default so a
			// pre-1.7.0 data.json loads without throwing (§ cross-cutting migration).
			localEvents: raw?.localEvents ?? [],
			streak: raw?.streak ?? { ...DEFAULT_STREAK },
			lineHistory: raw?.lineHistory ?? [],
			weeklyGoals: raw?.weeklyGoals ?? {},
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
		// No Markdown file yet. Migrate, in order of preference:
		//   1. the pre-1.5.6 `.json` vault file (existing users' real list),
		//   2. the legacy plugin-data todos,
		//   3. the seed defaults on a truly fresh install.
		const fromJson = await this.directives.loadLegacyJson();
		if (!fromJson) {
			const legacy = this.data.todos ?? [];
			this.directives.setItems(legacy.length > 0 || this.data.seeded ? legacy : seedTodos());
		}
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

	get streak(): StreakData {
		return this.data.streak;
	}

	get lineHistory(): LineHistoryEntry[] {
		return this.data.lineHistory;
	}

	/** Record a committed MERIDIAN line into the persisted history (§3.2). FIFO,
	 * capped at 100. Read-only afterward — this only logs the closed pool's output. */
	recordLine(line: string): void {
		const hist = this.data.lineHistory;
		if (hist.length && hist[hist.length - 1].line === line) return; // no immediate dupes
		hist.push({ line, at: Date.now() });
		while (hist.length > 100) hist.shift();
		void this.saveData_();
	}

	// ------------------------------------------------------- local events (§2.1)

	get localEvents(): LocalEvent[] {
		return this.data.localEvents;
	}

	async addLocalEvent(ev: Omit<LocalEvent, "id">): Promise<void> {
		this.data.localEvents.push({ id: localId(), ...ev });
		await this.saveData_();
		this.refreshOpenViews("vault");
	}

	async updateLocalEvent(id: string, patch: Partial<Omit<LocalEvent, "id">>): Promise<void> {
		const ev = this.data.localEvents.find((e) => e.id === id);
		if (!ev) return;
		Object.assign(ev, patch);
		await this.saveData_();
		this.refreshOpenViews("vault");
	}

	async removeLocalEvent(id: string): Promise<void> {
		this.data.localEvents = this.data.localEvents.filter((e) => e.id !== id);
		await this.saveData_();
		this.refreshOpenViews("vault");
	}

	// ------------------------------------------------------- weekly goals

	/** Goals for the week starting `weekKey` (YYYY-MM-DD). */
	weeklyGoalsFor(weekKey: string): WeeklyGoal[] {
		return this.data.weeklyGoals[weekKey] ?? [];
	}

	async addWeeklyGoal(weekKey: string, text: string): Promise<void> {
		const trimmed = text.trim();
		if (!trimmed) return;
		const list = this.data.weeklyGoals[weekKey] ?? (this.data.weeklyGoals[weekKey] = []);
		list.push({ id: localId(), text: trimmed });
		await this.saveData_();
	}

	async removeWeeklyGoal(weekKey: string, id: string): Promise<void> {
		const list = this.data.weeklyGoals[weekKey];
		if (!list) return;
		this.data.weeklyGoals[weekKey] = list.filter((g) => g.id !== id);
		if (this.data.weeklyGoals[weekKey].length === 0) delete this.data.weeklyGoals[weekKey];
		await this.saveData_();
	}

	// ------------------------------------------------------------- streak (§2.2)

	/** Whether a day "counts": its note exists and holds a completed task, a
	 * journal write, or any marker-log line. Existence alone is too weak — the
	 * template auto-creates empty notes. */
	private async dayCounts(date: string): Promise<boolean> {
		if (!getDailyNoteFile(this.app, date)) return false;
		const raw = await readDailyNoteRaw(this.app, date);
		// A completed-tasks entry.
		const completed = readField(raw, headingField(this.settings.completedTasksHeading));
		if (completed.split("\n").some((l) => /^\s*-\s+\S/.test(l))) return true;
		// A journal write in any of the free-text sections.
		for (const field of LOG_FIELDS) {
			const body = readField(raw, LOG_FIELD_SPECS[field]);
			if (body.split("\n").some((l) => l.trim() && !/^\s*-\s*(\[[ xX]?\]\s*)?$/.test(l))) return true;
		}
		// Any marker-log line (nourishment, regulation, contacts).
		for (const marker of ["%% arfid-log %%", "%% spiral-log %%", "%% crm-log %%"]) {
			if (readMarkerLogLines(raw, marker).length > 0) return true;
		}
		return false;
	}

	/** Recompute the streak by scanning the daily notes backward from today, so
	 * the count is correct no matter when this runs (self-healing). Idempotent
	 * per day once today is locked in; a broken streak is silent. Records a
	 * new-record day in runtime as a milestone trigger. */
	async updateStreak(): Promise<void> {
		const today = moment().format("YYYY-MM-DD");
		if (this.data.streak.lastDayCounted === today) return; // already locked in today

		// Walk backward, collecting whether each day qualifies, stopping at the
		// first gap once we're past today/yesterday. dayCounts uses cachedRead, so
		// repeated scans are cheap; the scan runs until today's first activity, then
		// the lastDayCounted guard above short-circuits it for the rest of the day.
		const counts: boolean[] = [];
		for (let i = 0; i < 366; i++) {
			const c = await this.dayCounts(moment().subtract(i, "day").format("YYYY-MM-DD"));
			counts.push(c);
			if (!c && i >= 1) break;
		}

		const todayCounts = counts[0];
		const current = currentStreakFromDays(counts);
		const prevLongest = this.data.streak.longest;
		const longest = Math.max(prevLongest, current);
		const next: StreakData = {
			current,
			longest,
			lastDayCounted: todayCounts ? today : this.data.streak.lastDayCounted,
		};
		const changed =
			next.current !== this.data.streak.current ||
			next.longest !== this.data.streak.longest ||
			next.lastDayCounted !== this.data.streak.lastDayCounted;
		this.data.streak = next;
		if (todayCounts && current > prevLongest) this.runtime.streakRecordDate = today;
		if (changed) {
			await this.saveData_();
			this.refreshOpenViews("vault");
		}
	}

	/** Reschedule a one-shot timer to just after the next local midnight; on fire
	 * it recomputes the streak (day rollover) and re-arms. */
	private scheduleMidnight(): void {
		if (this.midnightTimer !== null) window.clearTimeout(this.midnightTimer);
		const msToMidnight = moment().endOf("day").valueOf() - Date.now() + 2000;
		this.midnightTimer = window.setTimeout(() => {
			this.midnightTimer = null;
			void this.updateStreak();
			this.refreshOpenViews("vault");
			this.scheduleMidnight();
		}, Math.max(1000, msToMidnight));
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
			// Don't re-render (and reflow the masonry) while the Operator is typing
			// in a free-text field — defer until a beat after they stop.
			if (Date.now() < this.runtime.typingUntil) {
				this.scheduleRefresh();
				return;
			}
			this.refreshOpenViews("vault");
			// Recompute the streak when the vault changes — this is the moment
			// today's note earns its mark (a completed task archived, a journal
			// save, a marker-log line). Without this the streak only recomputed on
			// open and at midnight, when today's note is still empty, so a day the
			// dashboard stayed open through was never counted. Cheap once counted
			// (guarded on lastDayCounted === today).
			void this.updateStreak();
		}, 300);
	}
}

function localId(): string {
	const c = (globalThis as unknown as { crypto?: Crypto }).crypto;
	if (c?.randomUUID) return c.randomUUID();
	return "le-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

import { App, PluginSettingTab, Setting } from "obsidian";
import type MeridianDashPlugin from "./main";
import { TodoItem } from "./core/todostore";
import { PANEL_ORDER, PANEL_TITLES } from "./panels/registry";

export interface CalendarLink {
	label: string;
	url: string;
}

export interface PlaceLink {
	label: string;
	/** A note/base link target (e.g. "Central Hub", "Logs Hub.base") or a
	 * command id (when `type` is "command"). */
	target: string;
	type: "note" | "command";
}

export interface MeridianSettings {
	openOnStartup: boolean;
	panelOrder: string[];
	enabledPanels: Record<string, boolean>;
	meridianRotationMinutes: number;
	agendaRefreshMinutes: number;
	agendaUrls: CalendarLink[];
	kbSearchPath: string;
	/** Knowledge Base (information library) — root + subfolders + category list
	 * heading, for category management on the KB card. */
	kbRootPath: string;
	kbNotesSubfolder: string;
	kbCategoriesSubfolder: string;
	kbArchiveSubfolder: string;
	kbListHeading: string;
	places: PlaceLink[];
	/** Second Brain (ongoing-project library) folder + subfolders + list heading. */
	secondBrainPath: string;
	secondBrainCategoriesSubfolder: string;
	secondBrainArchiveSubfolder: string;
	secondBrainListHeading: string;
	/** Vault file the persistent directives (to-dos) live in, so Obsidian Sync
	 * propagates them across devices. */
	directivesPath: string;
	/** Archive target for completed to-dos (§7.4). */
	completedTasksMarker: string;
	completedTasksHeading: string;
	/** Marker Simple Contact Manager writes its daily log under (for reconcile). */
	crmLogMarker: string;
	crmLogHeading: string;
}

export interface MeridianData {
	settings: MeridianSettings;
	todos: TodoItem[];
	lastAccess: number;
	seeded: boolean;
	/** Per-URL last successful ICS fetch (§7.5 offline cache). */
	agendaCache: Record<string, { text: string; fetchedAt: number }>;
	/** Date a milestone line was last shown, so it never fires twice a day (§7.3). */
	milestoneShownDate: string;
}

export const DEFAULT_SETTINGS: MeridianSettings = {
	openOnStartup: false,
	panelOrder: [...PANEL_ORDER],
	enabledPanels: Object.fromEntries(PANEL_ORDER.map((id) => [id, true])),
	meridianRotationMinutes: 5,
	agendaRefreshMinutes: 30,
	agendaUrls: [],
	kbSearchPath: "Knowledge base/Notes/",
	kbRootPath: "Knowledge base",
	kbNotesSubfolder: "Notes",
	kbCategoriesSubfolder: "Categories",
	kbArchiveSubfolder: "Archive",
	kbListHeading: "Notes",
	secondBrainPath: "Second Brain",
	secondBrainCategoriesSubfolder: "Categories",
	secondBrainArchiveSubfolder: "Archive",
	secondBrainListHeading: "Notes",
	directivesPath: "MERIDIAN/Directives.json",
	places: [
		{ label: "Central Hub", target: "Central Hub", type: "note" },
		{ label: "Contact Dashboard", target: "Contact Dashboard", type: "note" },
		{ label: "Logs Hub", target: "Logs Hub.base", type: "note" },
		{ label: "SDM", target: "SDM.base", type: "note" },
		{ label: "ARFID Dashboard", target: "arfid-tracker:open-dashboard", type: "command" },
		{ label: "Spiral Log", target: "spiral-shutdown-logger:open-dashboard", type: "command" },
		{ label: "Contacts", target: "simple-contact-manager:open-dashboard", type: "command" },
		{ label: "Recipe Index", target: "recipe-manager:recipe-index", type: "command" },
	],
	completedTasksMarker: "",
	completedTasksHeading: "Completed tasks",
	crmLogMarker: "%% crm-log %%",
	crmLogHeading: "Contacts reached",
};

export function mergeSettings(loaded: Partial<MeridianSettings> | undefined): MeridianSettings {
	const s: MeridianSettings = { ...DEFAULT_SETTINGS, ...(loaded ?? {}) };
	// Keep panel order/enable maps whole even as panels are added in future versions.
	const order = (loaded?.panelOrder ?? []).filter((id) => PANEL_ORDER.includes(id));
	for (const id of PANEL_ORDER) if (!order.includes(id)) order.push(id);
	s.panelOrder = order;
	s.enabledPanels = { ...DEFAULT_SETTINGS.enabledPanels, ...(loaded?.enabledPanels ?? {}) };
	// Don't share default array/object instances.
	s.agendaUrls = (loaded?.agendaUrls ?? DEFAULT_SETTINGS.agendaUrls).map((c) => ({ ...c }));
	s.places = (loaded?.places ?? DEFAULT_SETTINGS.places).map((p) => ({ ...p }));
	return s;
}

export class MeridianSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: MeridianDashPlugin) {
		super(app, plugin);
	}

	private async save(): Promise<void> {
		await this.plugin.saveData_();
		this.plugin.refreshOpenViews();
	}

	/** Persist and re-mount open views — for panel enable/reorder changes, where
	 * a refresh alone wouldn't change the mounted order. */
	private async saveLayout(): Promise<void> {
		await this.plugin.saveData_();
		this.plugin.rebuildOpenViews();
	}

	display(): void {
		const { containerEl } = this;
		const s = this.plugin.settings;
		containerEl.empty();

		new Setting(containerEl).setName("General").setHeading();

		new Setting(containerEl)
			.setName("Open on startup")
			.setDesc("Replace the empty new tab with the MERIDIAN dashboard when Obsidian starts.")
			.addToggle((t) =>
				t.setValue(s.openOnStartup).onChange(async (v) => {
					s.openOnStartup = v;
					await this.save();
				})
			);

		// -------- panels: enable + reorder --------
		new Setting(containerEl)
			.setName("Panels")
			.setDesc("Toggle panels on or off, and reorder them. Everything is visible by default; the layout stacks to one column on a phone and spreads to a grid on the desktop.")
			.setHeading();

		const list = containerEl.createDiv({ cls: "mrd-settings-panel-list" });
		const renderList = () => {
			list.empty();
			s.panelOrder.forEach((id, index) => {
				const row = new Setting(list).setName(PANEL_TITLES[id] ?? id);
				row.addExtraButton((b) =>
					b
						.setIcon("arrow-up")
						.setTooltip("Move up")
						.setDisabled(index === 0)
						.onClick(async () => {
							[s.panelOrder[index - 1], s.panelOrder[index]] = [s.panelOrder[index], s.panelOrder[index - 1]];
							await this.saveLayout();
							renderList();
						})
				);
				row.addExtraButton((b) =>
					b
						.setIcon("arrow-down")
						.setTooltip("Move down")
						.setDisabled(index === s.panelOrder.length - 1)
						.onClick(async () => {
							[s.panelOrder[index + 1], s.panelOrder[index]] = [s.panelOrder[index], s.panelOrder[index + 1]];
							await this.saveLayout();
							renderList();
						})
				);
				row.addToggle((t) =>
					t.setValue(s.enabledPanels[id] !== false).onChange(async (v) => {
						s.enabledPanels[id] = v;
						await this.saveLayout();
					})
				);
			});
		};
		renderList();

		// -------- MERIDIAN line --------
		new Setting(containerEl).setName("MERIDIAN ambient line").setHeading();
		new Setting(containerEl)
			.setName("Rotation interval (minutes)")
			.setDesc("How often the ambient line rotates. It also rotates on refresh.")
			.addText((t) =>
				t.setValue(String(s.meridianRotationMinutes)).onChange(async (v) => {
					const n = Number(v);
					if (Number.isFinite(n) && n > 0) {
						s.meridianRotationMinutes = n;
						await this.save();
					}
				})
			);

		// -------- agenda --------
		new Setting(containerEl).setName("Today's agenda").setHeading();
		new Setting(containerEl)
			.setName("Refresh interval (minutes)")
			.setDesc("How often calendars are re-fetched while the dashboard is open.")
			.addText((t) =>
				t.setValue(String(s.agendaRefreshMinutes)).onChange(async (v) => {
					const n = Number(v);
					if (Number.isFinite(n) && n > 0) {
						s.agendaRefreshMinutes = n;
						await this.save();
					}
				})
			);
		new Setting(containerEl)
			.setName("Calendar share links")
			.setDesc("Up to 10 public ICS (.ics) URLs, one per line, as `Label | https://…`. Today only — no month view.")
			.addTextArea((t) => {
				t.setValue(s.agendaUrls.map((c) => `${c.label} | ${c.url}`).join("\n"));
				t.inputEl.rows = 6;
				t.onChange(async (v) => {
					s.agendaUrls = v
						.split("\n")
						.map((line) => line.trim())
						.filter(Boolean)
						.slice(0, 10)
						.map((line) => {
							const bar = line.indexOf("|");
							if (bar === -1) return { label: "Calendar", url: line };
							return { label: line.slice(0, bar).trim() || "Calendar", url: line.slice(bar + 1).trim() };
						});
					await this.save();
				});
			});

		// -------- knowledge base --------
		new Setting(containerEl).setName("Knowledge base").setHeading();
		new Setting(containerEl)
			.setName("Search folder")
			.setDesc("Fuzzy search is scoped to this folder only.")
			.addText((t) =>
				t.setPlaceholder(DEFAULT_SETTINGS.kbSearchPath).setValue(s.kbSearchPath).onChange(async (v) => {
					s.kbSearchPath = v.trim() || DEFAULT_SETTINGS.kbSearchPath;
					await this.save();
				})
			);
		this.addText(containerEl, "Library root", "Root folder for knowledge-base category management.", s.kbRootPath, (v) => (s.kbRootPath = v || "Knowledge base"));
		this.addText(containerEl, "Notes subfolder", "Where notes live, relative to the library root — the pool you assign to categories.", s.kbNotesSubfolder, (v) => (s.kbNotesSubfolder = v), true);
		this.addText(containerEl, "Categories subfolder", "Where category notes live, relative to the library root.", s.kbCategoriesSubfolder, (v) => (s.kbCategoriesSubfolder = v || "Categories"));
		this.addText(containerEl, "Category list heading", "Heading in a category note under which the alphabetized wikilinks live.", s.kbListHeading, (v) => (s.kbListHeading = v || "Notes"));

		// -------- second brain --------
		new Setting(containerEl).setName("Second Brain").setHeading();
		this.addText(containerEl, "Second Brain folder", "The ongoing-project library the Second Brain panel manages.", s.secondBrainPath, (v) => (s.secondBrainPath = v || "Second Brain"));
		this.addText(containerEl, "Archive subfolder", "Where archived notes are moved, relative to the Second Brain folder.", s.secondBrainArchiveSubfolder, (v) => (s.secondBrainArchiveSubfolder = v || "Archive"));

		// -------- places --------
		new Setting(containerEl).setName("Places / navigation").setHeading();
		new Setting(containerEl)
			.setName("Destinations")
			.setDesc(
				"One per line as `Label | target`. A target is a note/base name (e.g. `Central Hub`, `Logs Hub.base`) or, prefixed with `cmd:`, a command id (e.g. `cmd:arfid-tracker:open-dashboard`)."
			)
			.addTextArea((t) => {
				t.setValue(
					s.places
						.map((p) => `${p.label} | ${p.type === "command" ? "cmd:" + p.target : p.target}`)
						.join("\n")
				);
				t.inputEl.rows = 8;
				t.onChange(async (v) => {
					s.places = v
						.split("\n")
						.map((line) => line.trim())
						.filter(Boolean)
						.map((line) => {
							const bar = line.indexOf("|");
							const label = bar === -1 ? line : line.slice(0, bar).trim();
							let target = bar === -1 ? line : line.slice(bar + 1).trim();
							const type: PlaceLink["type"] = target.startsWith("cmd:") ? "command" : "note";
							if (type === "command") target = target.slice(4).trim();
							return { label, target, type };
						});
					await this.save();
				});
			});

		// -------- directives storage --------
		new Setting(containerEl).setName("Directives").setHeading();
		this.addText(
			containerEl,
			"Directives file",
			"Vault file (JSON) the persistent to-do list is stored in. Kept in the vault — not plugin data — so Obsidian Sync propagates it across devices. Change only if you want it somewhere else.",
			s.directivesPath,
			(v) => (s.directivesPath = v || "MERIDIAN/Directives.json")
		);

		// -------- daily-note write targets --------
		new Setting(containerEl).setName("Daily note write targets").setHeading();
		this.addText(containerEl, "Completed-tasks heading", "Completed to-dos are archived under this heading.", s.completedTasksHeading, (v) => (s.completedTasksHeading = v || "Completed tasks"));
		this.addText(containerEl, "Completed-tasks marker", "Optional. If set, completed tasks go after this marker instead of the heading.", s.completedTasksMarker, (v) => (s.completedTasksMarker = v), true);
		this.addText(containerEl, "Contacts-reached marker", "Marker Simple Contact Manager writes its daily log under; used by the reconcile safety net.", s.crmLogMarker, (v) => (s.crmLogMarker = v));
		this.addText(containerEl, "Contacts-reached heading", "Fallback heading for the contacts-reached log.", s.crmLogHeading, (v) => (s.crmLogHeading = v || "Contacts reached"));
	}

	private addText(
		el: HTMLElement,
		name: string,
		desc: string,
		value: string,
		set: (v: string) => void,
		allowEmpty = false
	): void {
		new Setting(el)
			.setName(name)
			.setDesc(desc)
			.addText((t) =>
				t.setValue(value).onChange(async (v) => {
					const trimmed = v.trim();
					if (!trimmed && !allowEmpty) return;
					set(trimmed);
					await this.save();
				})
			);
	}
}

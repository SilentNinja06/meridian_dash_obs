import { ItemView, WorkspaceLeaf, setIcon } from "obsidian";
import type MeridianDashPlugin from "./main";
import { Panel, PanelContext, RefreshReason } from "./panels/types";
import { createPanels } from "./panels/registry";
import { computeLayout } from "dash-core";
import { MeridianPanel } from "./panels/meridian";
import { meridianCompanion } from "./companion";
import { MERIDIAN_COPY } from "./copy";

export const VIEW_TYPE_MERIDIAN = "meridian-dashboard";

interface Mounted {
	panel: Panel;
	host: HTMLElement; // the panel card
}

/**
 * The shell (§4): an ItemView that hosts registered panel modules in a
 * responsive layout. It owns the refresh bus and guarantees that a throwing
 * panel renders a calm, in-voice error card without taking down the dashboard.
 */
export class MeridianView extends ItemView {
	private mounted: Mounted[] = [];
	private grid!: HTMLElement;

	constructor(leaf: WorkspaceLeaf, private plugin: MeridianDashPlugin) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_MERIDIAN;
	}

	getDisplayText(): string {
		return "MERIDIAN Dashboard";
	}

	getIcon(): string {
		return "radar";
	}

	private ctx(): PanelContext {
		return {
			app: this.app,
			plugin: this.plugin,
			bridge: this.plugin.bridge,
			todos: this.plugin.todos,
			streak: this.plugin.streak,
			companion: meridianCompanion(this.plugin.bridge),
			copy: MERIDIAN_COPY,
			runtime: this.plugin.runtime,
			settings: () => this.plugin.settings,
			agendaCache: this.plugin.agendaCache,
			localEvents: this.plugin.localEvents,
			persist: () => this.plugin.saveData_(),
			requestRefresh: (reason: RefreshReason = "manual") => void this.refreshPanels(reason),
			markFoodFocus: () => {
				this.plugin.markFoodFocus();
				void this.refreshPanels("manual");
			},
		};
	}

	async onOpen(): Promise<void> {
		this.plugin.touchAccess();
		void this.plugin.updateStreak();
		await this.build();
	}

	/** Re-mount all panels — used when the panel set or order changes in
	 * settings (a plain refresh keeps the old mount order). */
	async rebuild(): Promise<void> {
		await this.build();
	}

	async onClose(): Promise<void> {
		this.teardown();
		this.contentEl.empty();
	}

	private teardown(): void {
		for (const m of this.mounted) {
			try {
				m.panel.unmount?.();
			} catch {
				/* ignore */
			}
		}
		this.mounted = [];
	}

	private async build(): Promise<void> {
		this.teardown();
		const root = this.contentEl;
		root.empty();
		root.addClass("mrd-root");

		this.renderChrome(root);

		this.grid = root.createDiv({ cls: "mrd-grid" });
		const s = this.plugin.settings;
		const panels = createPanels(s.panelOrder, s.enabledPanels, this.plugin);
		const ctx = this.ctx();

		// Deliberate desktop grid, if configured (§3.1). Unconfigured keeps the
		// existing masonry; the mobile stack is unaffected either way.
		const layout = computeLayout(s.panelOrder, s.enabledPanels, s.panelColumns, s.panelSpans);
		const placeById = new Map(layout.placements.map((p) => [p.id, p]));
		if (layout.configured) {
			this.grid.addClass("mrd-grid-cols");
			this.grid.style.setProperty("--mrd-cols", String(layout.columns));
		}

		for (const panel of panels) {
			const host = this.grid.createDiv({ cls: "mrd-panel" });
			host.dataset.panel = panel.id;
			if (layout.configured) {
				const p = placeById.get(panel.id);
				if (p) host.style.gridColumn = `${p.column} / span ${p.span}`;
			}
			this.mounted.push({ panel, host });
			await this.mountPanel(panel, host, ctx);
		}
	}

	private renderChrome(root: HTMLElement): void {
		const header = root.createDiv({ cls: "mrd-topbar" });
		const brand = header.createDiv({ cls: "mrd-brand" });
		brand.appendChild(radarMark());
		const label = brand.createDiv({ cls: "mrd-brand-text" });
		label.createDiv({ cls: "mrd-brand-name", text: "MERIDIAN" });
		label.createDiv({ cls: "mrd-brand-sub", text: "HALCYON SYSTEMS · STABILITY THROUGH OBSERVATION" });

		const refresh = header.createEl("button", { cls: "mrd-icon-btn", attr: { "aria-label": "Refresh" } });
		setIcon(refresh, "refresh-cw");
		refresh.addEventListener("click", () => void this.refreshPanels("manual"));
	}

	private async mountPanel(panel: Panel, host: HTMLElement, ctx: PanelContext): Promise<void> {
		host.empty();
		const body = host.createDiv({ cls: "mrd-panel-body" });
		try {
			await panel.mount(body, ctx);
		} catch (e) {
			this.renderErrorCard(host, panel, e);
		}
	}

	/** Calm, in-voice failure card — never glitch aesthetics, never a stack
	 * trace in the Operator's face (that goes to the console). (§4) */
	private renderErrorCard(host: HTMLElement, panel: Panel, err: unknown): void {
		console.error(`MERIDIAN Dashboard: panel "${panel.id}" failed`, err);
		host.empty();
		host.addClass("mrd-panel-error");
		const card = host.createDiv({ cls: "mrd-error-card" });
		const head = card.createDiv({ cls: "mrd-placard mrd-placard-muted" });
		head.createSpan({ cls: "mrd-placard-title", text: `${panel.title.toUpperCase()} — SUBSYSTEM UNAVAILABLE` });
		card.createDiv({
			cls: "mrd-error-note",
			text: "This subsystem could not be brought online. The condition has been logged. The rest of the facility is unaffected.",
		});
	}

	/** Force-rotate the mounted MERIDIAN panel, if present. Returns true if it
	 * was mounted and rotated (§1.1 `new-meridian-line`). */
	rotateMeridian(): boolean {
		let rotated = false;
		for (const m of this.mounted) {
			if (m.panel instanceof MeridianPanel) {
				void m.panel.rotate();
				rotated = true;
			}
		}
		return rotated;
	}

	async refreshPanels(reason: RefreshReason): Promise<void> {
		for (const m of this.mounted) {
			try {
				await m.panel.refresh?.(reason);
			} catch (e) {
				this.renderErrorCard(m.host, m.panel, e);
			}
		}
	}
}

/** Inline radar mark (§5): concentric rings + one off-center dot in a rounded
 * square — deliberately not a camera-iris shape. */
function radarMark(): SVGElement {
	const ns = "http://www.w3.org/2000/svg";
	const svg = document.createElementNS(ns, "svg");
	svg.setAttribute("viewBox", "0 0 32 32");
	svg.setAttribute("class", "mrd-radar-mark");
	svg.setAttribute("width", "28");
	svg.setAttribute("height", "28");
	const frame = document.createElementNS(ns, "rect");
	frame.setAttribute("x", "1.5");
	frame.setAttribute("y", "1.5");
	frame.setAttribute("width", "29");
	frame.setAttribute("height", "29");
	frame.setAttribute("rx", "7");
	frame.setAttribute("class", "mrd-radar-frame");
	svg.appendChild(frame);
	for (const r of [4, 8, 12]) {
		const c = document.createElementNS(ns, "circle");
		c.setAttribute("cx", "16");
		c.setAttribute("cy", "16");
		c.setAttribute("r", String(r));
		c.setAttribute("class", "mrd-radar-ring");
		svg.appendChild(c);
	}
	const dot = document.createElementNS(ns, "circle");
	dot.setAttribute("cx", "22");
	dot.setAttribute("cy", "11");
	dot.setAttribute("r", "2.2");
	dot.setAttribute("class", "mrd-radar-dot");
	svg.appendChild(dot);
	return svg;
}

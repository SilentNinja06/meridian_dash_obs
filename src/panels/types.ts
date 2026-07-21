import { BasePanel as CoreBasePanel, PanelContext, DashRuntime } from "dash-core";
import type MeridianDashPlugin from "../main";
import type { Bridge } from "../core/bridge";
import type { MeridianSettings } from "../settings";

/**
 * Host binding of the generic panel contract. The contract itself
 * (PanelContext, Panel, BasePanel, RefreshReason, DashCopy, placard) lives in
 * dash-core; this module re-exports it and extends it with MERIDIAN's host-only
 * capabilities, so panels keep importing from "./types" unchanged.
 */

// Re-export the generic pieces panels use as-is.
export { placard } from "dash-core";
export type { Panel, RefreshReason, DashCopy } from "dash-core";

/** MERIDIAN's runtime hints — the generic ones plus the host-specific pools. */
export interface MeridianRuntime extends DashRuntime {
	/** Recent MERIDIAN lines shown this session, to avoid repeats. */
	recentLines: string[];
	/** While `Date.now() < foodFocusUntil`, the `food` pool is eligible (§7.3). */
	foodFocusUntil: number;
	/** YYYY-MM-DD on which the streak set a new all-time record — a milestone
	 * trigger for that day (§2.2). "" otherwise. */
	streakRecordDate: string;
}

/**
 * The context MERIDIAN's panels receive: the generic core surface plus the
 * host-only members (the companion-plugin bridge, the plugin itself, the richer
 * runtime, and the concrete settings shape).
 */
export interface MeridianPanelContext extends PanelContext {
	plugin: MeridianDashPlugin;
	bridge: Bridge;
	runtime: MeridianRuntime;
	settings(): MeridianSettings;
}

/** Back-compat alias: existing panels that annotate `PanelContext` get the host
 * shape. New/core panels import `PanelContext` from dash-core directly. */
export type { MeridianPanelContext as PanelContext };

/**
 * Host-specialized BasePanel: fixes the generic context type to
 * MeridianPanelContext so panels can `extends BasePanel` with no generic
 * argument and still see `this.ctx.plugin` / `.bridge` / the richer runtime.
 */
export abstract class BasePanel extends CoreBasePanel<MeridianPanelContext> {}

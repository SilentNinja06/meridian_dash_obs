import type { DashCopy } from "dash-core";

/**
 * MERIDIAN's user-facing chrome/status copy, injected into core panels so the
 * shared code carries no voice. Dry, institutional register. This grows as core
 * panels that read `ctx.copy` are migrated; each key is documented by the panel
 * that reads it. Canon MERIDIAN lines never live here — only chrome/status text.
 */
export const MERIDIAN_COPY: DashCopy = {
	// Populated as copy-bearing core panels are migrated.
};

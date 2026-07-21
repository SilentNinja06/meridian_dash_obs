import { App } from "obsidian";
import { commandButton as coreCommandButton } from "dash-core";
import { MERIDIAN_COMMAND_OFFLINE } from "../copy";

/**
 * Host-bound command button: MERIDIAN's disabled-command tooltip is injected so
 * the call sites (spiral, actions, arfid, crm, meals) stay unchanged apart from
 * passing `app` instead of the bridge. The generic button lives in dash-core.
 */
export function commandButton(
	parent: HTMLElement,
	app: App,
	fullId: string,
	label: string,
	opts: { cls?: string; onRun?: () => void } = {}
): HTMLButtonElement {
	return coreCommandButton(parent, app, fullId, label, { ...opts, offlineText: MERIDIAN_COMMAND_OFFLINE });
}

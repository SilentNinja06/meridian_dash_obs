import { Bridge } from "../core/bridge";

/** A button wired to an Obsidian command. If the command is missing (plugin
 * disabled), the button is disabled with an in-voice tooltip — never a crash
 * (§7.11). */
export function commandButton(
	parent: HTMLElement,
	bridge: Bridge,
	fullId: string,
	label: string,
	opts: { cls?: string; onRun?: () => void } = {}
): HTMLButtonElement {
	const btn = parent.createEl("button", { cls: `mrd-btn ${opts.cls ?? ""}`.trim(), text: label });
	if (!bridge.commandExists(fullId)) {
		btn.setAttr("disabled", "true");
		btn.addClass("is-unavailable");
		btn.setAttr("title", "This subsystem is offline. Its plugin is not currently enabled.");
		return btn;
	}
	btn.addEventListener("click", () => {
		bridge.runCommand(fullId);
		opts.onRun?.();
	});
	return btn;
}

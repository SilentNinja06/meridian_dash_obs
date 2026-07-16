import { BasePanel, placard } from "./types";
import { commandButton } from "./util";

/**
 * Places / navigation (§7.13). A user-editable list of destinations: notes and
 * core Bases (`.base`) opened exactly the way a link click does, plus command
 * targets (the four plugin dashboards). Edit the list in settings.
 */
export class PlacesPanel extends BasePanel {
	id = "places";
	title = "Navigation";

	protected renderBody(): void {
		placard(this.el, "Navigation");
		const grid = this.el.createDiv({ cls: "mrd-places" });
		const places = this.ctx.settings().places;
		if (places.length === 0) {
			grid.createDiv({ cls: "mrd-muted", text: "No destinations configured. Add some in settings." });
			return;
		}
		for (const place of places) {
			if (place.type === "command") {
				commandButton(grid, this.ctx.bridge, place.target, place.label, { cls: "mrd-place-btn" });
			} else {
				const btn = grid.createEl("button", { cls: "mrd-btn mrd-place-btn", text: place.label });
				btn.addEventListener("click", () => {
					// Open notes and .base files the way a link click does.
					void this.ctx.app.workspace.openLinkText(place.target, "", false);
				});
			}
		}
	}
}

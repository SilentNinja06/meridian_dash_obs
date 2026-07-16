import { BasePanel, placard } from "./types";
import { commandButton } from "./util";

/**
 * Action buttons (§7.11). Grouped by plugin, each group a placard-headed block.
 * The three hard-moment actions — food quick-log, spiral quick-capture, and
 * "I'm struggling" — get pride of place in a one-tap row at the top. Missing
 * commands render as disabled buttons with an in-voice tooltip, never a crash.
 */
interface Group {
	title: string;
	commands: Array<[string, string]>; // [fullId, label]
	foodNudge?: boolean;
}

const GROUPS: Group[] = [
	{
		title: "Nourishment",
		foodNudge: true,
		commands: [
			["arfid-tracker:quick-log", "Log a food"],
			["arfid-tracker:log-exposure", "Log exposure"],
			["arfid-tracker:log-symptoms", "Log symptoms"],
			["arfid-tracker:add-food", "Add food"],
			["arfid-tracker:add-foods", "Add foods (bulk)"],
			["arfid-tracker:add-food-note", "Ritual / order / recipe"],
			["arfid-tracker:change-food-status", "Change food status"],
			["arfid-tracker:struggling", "I'm struggling"],
			["arfid-tracker:open-dashboard", "Dashboard"],
			["arfid-tracker:export-csv", "Export CSV"],
			["arfid-tracker:export-summary", "Export summary"],
		],
	},
	{
		title: "Regulation",
		commands: [
			["spiral-shutdown-logger:quick-capture", "Log an entry"],
			["spiral-shutdown-logger:thought-capture", "Jot a thought"],
			["spiral-shutdown-logger:open-dashboard", "Dashboard"],
			["spiral-shutdown-logger:export-csv", "Export CSV"],
			["spiral-shutdown-logger:export-summary", "Export summary"],
		],
	},
	{
		title: "Contacts",
		commands: [
			["simple-contact-manager:new-contact", "New contact"],
			["simple-contact-manager:log-interaction", "Log interaction"],
			["simple-contact-manager:open-dashboard", "Dashboard"],
		],
	},
	{
		title: "Provisioning",
		foodNudge: true,
		commands: [
			["recipe-manager:meal-plan", "Plan a meal"],
			["recipe-manager:grocery-list", "Grocery list"],
			["recipe-manager:new-recipe", "New recipe"],
			["recipe-manager:open-recipe", "Open recipe"],
			["recipe-manager:recipe-index", "Recipe index"],
			["recipe-manager:share", "Share / export"],
			["recipe-manager:nutrition", "Nutrition"],
			["recipe-manager:ingredient-data", "Ingredient data"],
		],
	},
];

export class ActionsPanel extends BasePanel {
	id = "actions";
	title = "Quick Actions";

	protected renderBody(): void {
		const { bridge } = this.ctx;
		placard(this.el, "Quick Actions");

		// One-tap hard-moment row.
		const nudge = () => this.ctx.markFoodFocus();
		const primary = this.el.createDiv({ cls: "mrd-btn-row mrd-actions-primary" });
		commandButton(primary, bridge, "arfid-tracker:quick-log", "Log a food", { cls: "mrd-btn-primary mrd-btn-lg", onRun: nudge });
		commandButton(primary, bridge, "spiral-shutdown-logger:quick-capture", "Log an entry", { cls: "mrd-btn-cold mrd-btn-lg" });
		commandButton(primary, bridge, "arfid-tracker:struggling", "I'm struggling", { cls: "mrd-btn-lg mrd-btn-warn", onRun: nudge });

		for (const group of GROUPS) {
			const block = this.el.createDiv({ cls: "mrd-actions-group" });
			block.createDiv({ cls: "mrd-subhead", text: group.title });
			const row = block.createDiv({ cls: "mrd-btn-row" });
			for (const [id, label] of group.commands) {
				commandButton(row, bridge, id, label, { cls: "mrd-btn-sm", onRun: group.foodNudge ? nudge : undefined });
			}
		}
	}
}

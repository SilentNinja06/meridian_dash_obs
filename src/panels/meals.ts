import { TFile } from "obsidian";
import { BasePanel, placard } from "./types";
import { commandButton } from "./util";

/**
 * Meals + grocery panel (§7.10) — given real design attention, not a link list.
 * Renders today's planned recipes as cards with links, and the current grocery
 * list (path read from Recipe Manager's setting) checkable inline, writing back
 * to the grocery file. Plus the Recipe Manager command buttons.
 */
export class MealsPanel extends BasePanel {
	id = "meals";
	title = "Meals & Provisioning";

	protected async renderBody(): Promise<void> {
		const { bridge, app } = this.ctx;
		placard(this.el, "Meals & Provisioning");

		if (!bridge.recipesAvailable()) {
			this.el.createDiv({ cls: "mrd-muted", text: "The provisioning subsystem is offline. Enable Recipe Manager to bring it online." });
			return;
		}

		// --- today's meals ---
		const meals = await bridge.plannedMeals();
		const mealsWrap = this.el.createDiv({ cls: "mrd-meals" });
		mealsWrap.createDiv({ cls: "mrd-subhead", text: "Planned today" });
		if (meals.length === 0) {
			mealsWrap.createDiv({ cls: "mrd-muted", text: "No meals planned today." });
		} else {
			const cards = mealsWrap.createDiv({ cls: "mrd-meal-cards" });
			for (const meal of meals) {
				const card = cards.createDiv({ cls: "mrd-meal-card" });
				card.createDiv({ cls: "mrd-meal-name", text: meal.name });
				card.createDiv({ cls: "mrd-meal-open", text: "Open recipe →" });
				card.addEventListener("click", () => {
					const dest = this.ctx.app.metadataCache.getFirstLinkpathDest(meal.link, "");
					if (dest instanceof TFile) void this.ctx.app.workspace.getLeaf(false).openFile(dest);
				});
			}
		}

		// --- grocery list ---
		const grocery = await bridge.groceryList();
		const gWrap = this.el.createDiv({ cls: "mrd-grocery" });
		gWrap.createDiv({ cls: "mrd-subhead", text: "Grocery list" });
		if (!grocery.exists) {
			gWrap.createDiv({ cls: "mrd-muted", text: `No grocery list at ${grocery.path}. Build one below.` });
		} else if (grocery.items.length === 0) {
			gWrap.createDiv({ cls: "mrd-muted", text: "The grocery list is present but has no items." });
		} else {
			const remaining = grocery.items.filter((i) => !i.checked).length;
			gWrap.createDiv({ cls: "mrd-grocery-count", text: `${remaining} of ${grocery.items.length} remaining` });
			const list = gWrap.createDiv({ cls: "mrd-grocery-list" });
			for (const item of grocery.items) {
				const row = list.createEl("label", { cls: "mrd-grocery-row" });
				if (item.checked) row.addClass("is-checked");
				const box = row.createEl("input", { attr: { type: "checkbox" } });
				box.checked = item.checked;
				box.addEventListener("change", async () => {
					await bridge.toggleGroceryItem(item.line);
					this.ctx.markFoodFocus();
					this.rerender();
				});
				row.createSpan({ cls: "mrd-grocery-name", text: item.name });
			}
		}

		// --- actions ---
		const actions = this.el.createDiv({ cls: "mrd-btn-row" });
		const nudge = () => this.ctx.markFoodFocus();
		commandButton(actions, app, "recipe-manager:meal-plan", "Plan a meal", { cls: "mrd-btn-primary", onRun: nudge });
		commandButton(actions, app, "recipe-manager:grocery-list", "Build grocery list", { onRun: nudge });
		commandButton(actions, app, "recipe-manager:open-recipe", "Open recipe", { onRun: nudge });
		commandButton(actions, app, "recipe-manager:new-recipe", "New recipe", { onRun: nudge });
		commandButton(actions, app, "recipe-manager:recipe-index", "Recipe index", { onRun: nudge });
	}
}

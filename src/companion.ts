import type { CompanionData } from "dash-core";
import type { Bridge } from "./core/bridge";

/**
 * MERIDIAN's implementation of core's `CompanionData` capability, adapting the
 * sibling-plugin `Bridge` to the lore-free shape core panels consume. Core never
 * names a companion plugin; this host maps its ARFID/Spiral readers in. Methods a
 * host can't support are simply omitted (they're optional in the interface).
 */
export function meridianCompanion(bridge: Bridge): CompanionData {
	return {
		spiralEntriesForDate: (date: string) => bridge.spiralEntriesForDate(date),
		nourishmentEntriesForDate: async (date: string) => (await bridge.arfidToday(date)).length,
		// Recipe Manager companion (drives the meals panel).
		recipesAvailable: () => bridge.recipesAvailable(),
		plannedMeals: (date?: string) => bridge.plannedMeals(date),
		groceryList: () => bridge.groceryList(),
		toggleGroceryItem: (line: number) => bridge.toggleGroceryItem(line),
	};
}

// Coverage for the app-wide skin's pure frontmatter-opt-out decision.
import { test, is } from "./_harness";
import { isSkinExempt } from "../src/appskin.css";

test("appskin: meridian-skin false exempts the note", () => {
	is(isSkinExempt({ "meridian-skin": false }), true);
});

test("appskin: absent frontmatter keeps the skin on", () => {
	is(isSkinExempt(undefined), false);
	is(isSkinExempt(null), false);
	is(isSkinExempt({}), false);
});

test("appskin: only a literal false exempts (true / strings / 0 do not)", () => {
	is(isSkinExempt({ "meridian-skin": true }), false);
	is(isSkinExempt({ "meridian-skin": "false" }), false);
	is(isSkinExempt({ "meridian-skin": 0 }), false);
	is(isSkinExempt({ "other-key": false }), false);
});

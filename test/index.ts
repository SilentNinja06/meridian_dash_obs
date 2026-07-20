// Test entry: importing each suite registers its cases, then report() runs them.
import "./subitems.test";
import "./directives.test";
import "./agenda.test";
import "./streak.test";
import { report } from "./_harness";

report();

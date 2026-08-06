import { toCsv } from "../lib/csv.ts";
import assert from "node:assert";

const out = toCsv([
	["a", 'b"c', "d,e", "f\nnewline", null, 42],
	["plain", "", "x", "y", false, ""],
]);

const [l0, l1] = out.split("\r\n");
assert.strictEqual(l0, 'a,"b""c","d,e","f\nnewline",,42');
assert.strictEqual(l1, "plain,,x,y,false,");
console.log("csv check passed");

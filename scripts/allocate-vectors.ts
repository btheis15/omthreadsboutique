// Allocation vectors shared with the shop's own tests (split-stock spec, section 10 item 3).
// Run: npx tsx scripts/allocate-vectors.ts   (exits non-zero on a mismatch)
import { allocateLine, preferFor, usShort, type StockSplit } from "../src/lib/variants";

const split = (stock: number | undefined, stockIn: number, mto: "US" | "IN" = "US"): StockSplit => ({ stock, stockIn, mto });
const cases: [string, ReturnType<typeof allocateLine>, { us: number; in: number }][] = [
  ["US dest, US 1 + India 1, qty 2", allocateLine(split(2, 1), 2, preferFor({ dest: "US" })), { us: 1, in: 1 }],
  ["US dest, qty 1 takes US first", allocateLine(split(2, 1), 1, preferFor({ dest: "US" })), { us: 1, in: 0 }],
  ["IN dest, qty 1 takes India first", allocateLine(split(2, 1), 1, preferFor({ dest: "IN" })), { us: 0, in: 1 }],
  ["IN dest, qty 2 -> in first then US", allocateLine(split(2, 1), 2, preferFor({ dest: "IN" })), { us: 1, in: 1 }],
  ["US only (prefer [US]) never touches India", allocateLine(split(2, 1), 2, ["US"]), { us: 2, in: 0 }],
  ["pickup prefers US only", allocateLine(split(3, 2), 1, preferFor({ pickupOrDelivery: true })), { us: 1, in: 0 }],
  ["beyond total goes to first choice", allocateLine(split(2, 1), 4, preferFor({ dest: "US" })), { us: 3, in: 1 }],
  ["made to order in India", allocateLine(split(undefined, 0, "IN"), 2, preferFor({ dest: "US" })), { us: 0, in: 2 }],
  ["made to order in the US", allocateLine(split(undefined, 0, "US"), 2, preferFor({ dest: "IN" })), { us: 2, in: 0 }],
  ["all stock in India", allocateLine(split(3, 3), 2, preferFor({ dest: "US" })), { us: 0, in: 2 }],
];
const flags: [string, boolean, boolean][] = [
  ["pickup refused when US is 0 (all in India)", usShort(split(3, 3), 1), true],
  ["pickup ok when US covers", usShort(split(3, 1), 2), false],
  ["pickup refused when bag exceeds US", usShort(split(3, 1), 3), true],
  ["made to order in India is not US", usShort(split(undefined, 0, "IN"), 1), true],
  ["made to order in US is fine", usShort(split(undefined, 0, "US"), 1), false],
];
let bad = 0;
for (const [name, got, want] of cases) if (got.us !== want.us || got.in !== want.in) { bad++; console.error(`FAIL ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
for (const [name, got, want] of flags) if (got !== want) { bad++; console.error(`FAIL ${name}: got ${got}`); }
console.log(bad ? `${bad} failed` : `ok (${cases.length + flags.length} vectors)`);
process.exit(bad ? 1 : 0);

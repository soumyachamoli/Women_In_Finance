const assert = require("assert");
const Parser = require("../js/parser.js");
const Budget = require("../js/budget.js");
const Calc = require("../js/calc.js");

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    console.log("FAIL", name, "-", e.message);
    process.exitCode = 1;
  }
}

test("two entries in one sentence", () => {
  const items = Parser.parse("aaj dhaage pe 450 lage aur blouse silai ke 2000 aaye");
  assert.strictEqual(items.length, 2);
  assert.deepStrictEqual([items[0].amount, items[0].kind, items[0].category], [450, "expense", "materials"]);
  assert.deepStrictEqual([items[1].amount, items[1].kind, items[1].category], [2000, "income", "work"]);
});

test("devanagari", () => {
  const items = Parser.parse("आज 450 का धागा लिया और सिलाई के 2000 मिले");
  assert.strictEqual(items[0].category, "materials");
  assert.strictEqual(items[1].kind, "income");
  assert.strictEqual(Parser.parse("आज 300 की सब्ज़ी ली")[0].category, "food");
});

test("hindi number words", () => {
  assert.strictEqual(Parser.parse("dedh hazaar ka kiraya diya")[0].amount, 1500);
  assert.strictEqual(Parser.parse("dhai sau ki dawai li")[0].amount, 250);
  assert.strictEqual(Parser.parse("do hazaar paanch sau mile")[0].amount, 2500);
  assert.strictEqual(Parser.parse("saade teen hazaar ki salary mili")[0].amount, 3500);
  assert.strictEqual(Parser.parse("डेढ़ हज़ार का राशन")[0].amount, 1500);
});

test("k, commas and rupee sign", () => {
  assert.strictEqual(Parser.parse("2k ka maal liya")[0].amount, 2000);
  assert.strictEqual(Parser.parse("₹1,250 bijli ka bill")[0].amount, 1250);
});

test("no amount", () => {
  assert.deepStrictEqual(Parser.parse("aaj kuch nahi liya"), []);
});

test("classifier fallback", () => {
  assert.strictEqual(Parser.parse("chai samose pe 60")[0].category, "food");
  assert.strictEqual(Parser.parse("train ticket 90")[0].category, "transport");
});

test("percentile and safe budget", () => {
  assert.strictEqual(Budget.percentile([1, 2, 3, 4, 5], 50), 3);
  assert.strictEqual(Budget.safeWeeklyBudget([3000, 1500, 4000, 2500, 3500]), 2300);
  assert.strictEqual(Budget.safeWeeklyBudget([2000]), 1600);
  assert.strictEqual(Budget.safeWeeklyBudget([]), null);
});

test("weekly income", () => {
  const today = new Date(2026, 9, 21);
  const entries = [
    { date: "2026-10-06", kind: "income", amount: 2000 },
    { date: "2026-10-14", kind: "income", amount: 3000 },
    { date: "2026-10-15", kind: "expense", amount: 500 }
  ];
  assert.deepStrictEqual(Budget.weeklyIncome(entries, today), [2000, 3000]);
});

test("saving suggestion and streak", () => {
  assert.strictEqual(Budget.savingSuggestion(3000, 2000), 500);
  assert.strictEqual(Budget.savingSuggestion(1500, 2000), 0);
  const today = new Date(2026, 9, 21);
  assert.strictEqual(Budget.streakDays(["2026-10-21", "2026-10-20", "2026-10-19", "2026-10-17"], today), 3);
  assert.strictEqual(Budget.streakDays(["2026-10-20"], today), 1);
});

test("sip and emi", () => {
  assert.deepStrictEqual(Calc.sip(1000, 12, 1), { invested: 12000, returns: 809, total: 12809 });
  assert.strictEqual(Calc.sip(500, 0, 2).total, 12000);
  assert.strictEqual(Calc.emi(100000, 12, 12).emi, 8885);
  assert.strictEqual(Calc.emi(12000, 0, 12).emi, 1000);
});

console.log(passed + " tests passed");

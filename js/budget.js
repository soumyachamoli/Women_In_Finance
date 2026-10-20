(function (root) {
  function toDate(s) {
    var p = s.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function toKey(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }

  function addDays(d, n) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() + n);
    return x;
  }

  function weekStart(d) {
    return addDays(d, -((d.getDay() + 6) % 7));
  }

  function percentile(values, p) {
    var data = values.slice().sort(function (a, b) { return a - b; });
    if (!data.length) return null;
    var k = (data.length - 1) * p / 100;
    var lo = Math.floor(k), hi = Math.ceil(k);
    if (lo === hi) return data[lo];
    return data[lo] + (data[hi] - data[lo]) * (k - lo);
  }

  function weeklyIncome(entries, today, weeks) {
    weeks = weeks || 8;
    if (!entries.length) return [];
    var first = entries.reduce(function (a, e) { return e.date < a ? e.date : a; }, entries[0].date);
    var firstWeek = toKey(weekStart(toDate(first)));
    var thisWeek = weekStart(today);
    var totals = {};
    entries.forEach(function (e) {
      if (e.kind !== "income") return;
      var ws = toKey(weekStart(toDate(e.date)));
      totals[ws] = (totals[ws] || 0) + Number(e.amount);
    });
    var history = [];
    for (var i = weeks; i > 0; i--) {
      var ws = toKey(addDays(thisWeek, -7 * i));
      if (ws >= firstWeek) history.push(totals[ws] || 0);
    }
    return history;
  }

  function safeWeeklyBudget(history) {
    if (!history.length) return null;
    if (history.length < 3) {
      var sum = history.reduce(function (a, b) { return a + b; }, 0);
      return Math.round(sum / history.length * 0.8);
    }
    return Math.round(percentile(history, 20));
  }

  function savingSuggestion(income, base) {
    if (!base || income <= base) return 0;
    var amount = Math.floor((income - base) * 0.5 / 50) * 50;
    return amount >= 50 ? amount : 0;
  }

  function streakDays(dateKeys, today) {
    var set = {};
    dateKeys.forEach(function (k) { set[k] = true; });
    var d = set[toKey(today)] ? today : addDays(today, -1);
    var count = 0;
    while (set[toKey(d)]) {
      count++;
      d = addDays(d, -1);
    }
    return count;
  }

  var api = {
    toDate: toDate, toKey: toKey, addDays: addDays, weekStart: weekStart, percentile: percentile,
    weeklyIncome: weeklyIncome, safeWeeklyBudget: safeWeeklyBudget, savingSuggestion: savingSuggestion, streakDays: streakDays
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Budget = api;
})(this);

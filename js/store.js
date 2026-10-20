(function (root) {
  var KEY = "wif-data-v1";

  function empty() {
    return { entries: [], goals: [], holdings: [], lessonsDone: [], vault: null };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? Object.assign(empty(), JSON.parse(raw)) : empty();
    } catch (e) {
      return empty();
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function clear() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
  }

  function rng(seed) {
    return function () {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
  }

  function demo(current) {
    var r = rng(7);
    var pick = function (list) { return list[Math.floor(r() * list.length)]; };
    var work = ["blouse silai", "suit silai", "alteration", "fall pico", "school uniform order"];
    var spend = [["food", "sabzi"], ["food", "doodh aur atta"], ["materials", "dhaaga aur button"], ["materials", "kapda"],
      ["transport", "auto"], ["bills", "mobile recharge"], ["household", "sabun"]];
    var today = new Date();
    var entries = [];
    for (var d = 42; d > 0; d--) {
      var date = Budget.toKey(Budget.addDays(today, -d));
      if (r() < 0.45) {
        entries.push({ id: "di" + d, kind: "income", category: "work", amount: pick([300, 450, 600, 800, 1200, 2000]), note: pick(work), date: date, created: d });
      }
      if (r() < 0.7) {
        var s = pick(spend);
        entries.push({ id: "de" + d, kind: "expense", category: s[0], amount: pick([40, 60, 120, 200, 350]), note: s[1], date: date, created: d });
      }
    }
    var goals = [{ id: "g1", name: "Emergency fund", target: 5000, saved: 1200, date: Budget.toKey(Budget.addDays(today, 150)) }];
    return Object.assign(empty(), { entries: entries, goals: goals, vault: current ? current.vault : null });
  }

  root.Store = { load: load, save: save, clear: clear, demo: demo };
})(this);

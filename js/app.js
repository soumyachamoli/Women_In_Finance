(function () {
  var CATEGORIES = [
    ["food", "Food & groceries"], ["materials", "Work materials"], ["household", "Household"],
    ["bills", "Bills & rent"], ["transport", "Transport"], ["health", "Health"],
    ["education", "Education"], ["work", "Work income"], ["other", "Other"]
  ];
  var HOLDING_KINDS = [
    ["mf", "Mutual fund / SIP"], ["fd", "Fixed deposit"], ["rd", "Recurring deposit"], ["gold", "Gold"],
    ["stock", "Shares"], ["ppf", "PPF / Sukanya"], ["other", "Other"]
  ];
  var LABELS = {};
  CATEGORIES.concat(HOLDING_KINDS).forEach(function (c) { LABELS[c[0]] = c[1]; });

  var main = document.getElementById("main");
  var data = Store.load();
  var pending = [];
  var heard = "";
  var flash = null;
  var vaultKey = null;
  var lockTimer = null;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function inr(value) {
    var n = Math.round(Number(value) || 0);
    var neg = n < 0;
    var s = String(Math.abs(n));
    if (s.length > 3) {
      var head = s.slice(0, -3), tail = s.slice(-3), groups = [];
      while (head.length > 2) {
        groups.unshift(head.slice(-2));
        head = head.slice(0, -2);
      }
      if (head) groups.unshift(head);
      s = groups.join(",") + "," + tail;
    }
    return (neg ? "-" : "") + "₹" + s;
  }

  function today() {
    return new Date();
  }

  function todayKey() {
    return Budget.toKey(today());
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function save() {
    Store.save(data);
  }

  function notify(text, type) {
    flash = { text: text, type: type || "success" };
  }

  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  function options(list, selected) {
    return list.map(function (o) {
      return '<option value="' + o[0] + '"' + (o[0] === selected ? " selected" : "") + ">" + esc(o[1]) + "</option>";
    }).join("");
  }

  function shortDate(key) {
    return Budget.toDate(key).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  function longDate(key) {
    return Budget.toDate(key).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  function sortedEntries() {
    return data.entries.slice().sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return (b.created || 0) - (a.created || 0);
    });
  }

  function entryRow(e, withDelete) {
    var sign = e.kind === "income" ? "+" : "-";
    return '<div class="entry"><div><strong>' + esc(LABELS[e.category] || e.category) + "</strong>" +
      '<span class="muted">' + (withDelete ? longDate(e.date) : shortDate(e.date)) + (e.note ? " · " + esc(e.note) : "") + "</span></div>" +
      '<div class="row"><span class="' + e.kind + '">' + sign + inr(e.amount) + "</span>" +
      (withDelete ? '<button class="link danger" data-click="delete-entry" data-id="' + e.id + '">Delete</button>' : "") +
      "</div></div>";
  }

  function progress(goal) {
    return goal.target ? Math.min(100, Math.floor(goal.saved / goal.target * 100)) : 0;
  }

  function monthlyNeeded(goal) {
    if (!goal.date || goal.date <= todayKey()) return null;
    var end = Budget.toDate(goal.date), now = today();
    var months = (end.getFullYear() - now.getFullYear()) * 12 + end.getMonth() - now.getMonth();
    return Math.max(goal.target - goal.saved, 0) / Math.max(months, 1);
  }

  function nextLesson() {
    var done = data.lessonsDone;
    var order = [];
    if (!data.goals.length) order.push("emergency-fund");
    order.push("budget-irregular-income");
    if (data.goals.length && !data.holdings.length) order.push("what-is-sip");
    LESSONS.forEach(function (l) { order.push(l.slug); });
    for (var i = 0; i < order.length; i++) {
      if (done.indexOf(order[i]) < 0) return findLesson(order[i]);
    }
    return null;
  }

  function findLesson(slug) {
    return LESSONS.filter(function (l) { return l.slug === slug; })[0];
  }

  function quickAddForm(label) {
    return '<form data-action="parse">' +
      '<label for="say">' + label + "</label>" +
      '<textarea id="say" name="text" rows="3" required placeholder="जैसे: आज 450 का धागा लिया और 2000 सिलाई के मिले"></textarea>' +
      '<div class="row"><button type="button" class="secondary" data-voice="say">Speak (Hindi)</button>' +
      '<button type="submit">Add</button></div></form>';
  }

  var views = {};

  views.home = function () {
    var now = today();
    var start = Budget.toKey(Budget.weekStart(now));
    var since = Budget.toKey(Budget.addDays(now, -63));
    var rows = data.entries.filter(function (e) { return e.date >= since; });
    var income = 0, spent = 0;
    rows.forEach(function (e) {
      if (e.date < start) return;
      if (e.kind === "income") income += Number(e.amount);
      else spent += Number(e.amount);
    });
    var base = Budget.safeWeeklyBudget(Budget.weeklyIncome(rows, now));
    var left = base === null ? null : Math.max(base - spent, 0);
    var hint = Budget.savingSuggestion(income, base);
    var streak = Budget.streakDays(data.entries.map(function (e) { return e.date; }), now);
    var lesson = nextLesson();
    var recent = sortedEntries().slice(0, 5);

    var html = "<h1>Namaste</h1>";
    if (!data.entries.length) {
      html += '<section class="card note">New here? <button class="link" data-click="demo">Load sample data</button> to see how it works, or add your first entry below.</section>';
    }
    html += '<section class="card">' + quickAddForm("What did you earn or spend today?") + "</section>";

    html += '<section class="grid"><div class="card highlight"><p class="label">Safe to spend this week</p>';
    if (left !== null) {
      var used = base ? Math.min(100, Math.round(spent / base * 100)) : 100;
      html += '<p class="big">' + inr(left) + "</p>" +
        '<div class="bar small-bar"><span style="width:' + used + '%"></span></div>' +
        '<p class="muted">' + inr(spent) + " spent of " + inr(base) + ", based on your lower-income weeks</p>";
    } else {
      html += '<p class="muted">Add your income for a week or two and this will show how much you can safely spend.</p>';
    }
    html += '</div><div class="card"><p class="label">This week</p>' +
      "<p>Earned <strong>" + inr(income) + "</strong></p><p>Spent <strong>" + inr(spent) + "</strong></p>" +
      (streak ? '<p class="muted">' + streak + " day" + (streak === 1 ? "" : "s") + " in a row of tracking</p>" : "") +
      "</div></section>";

    if (hint) {
      html += '<section class="card note">Good week! You earned more than usual. Move <strong>' + inr(hint) + '</strong> to a goal? <a href="#goals">Go to goals</a></section>';
    }
    if (lesson) {
      html += '<section class="card"><p class="label">Today\'s 1-minute lesson</p><a href="#lesson/' + lesson.slug + '"><strong>' +
        esc(lesson.title) + '</strong></a><p class="muted">' + esc(lesson.hindi) + "</p></section>";
    }
    if (data.goals.length) {
      html += '<section class="card"><p class="label">Goals</p>';
      data.goals.slice(0, 3).forEach(function (g) {
        html += '<div class="goal-line"><span>' + esc(g.name) + '</span><span class="muted">' + inr(g.saved) + " / " + inr(g.target) + "</span></div>" +
          '<div class="bar"><span style="width:' + progress(g) + '%"></span></div>';
      });
      html += "</section>";
    }
    html += '<section class="card"><p class="label">Recent entries</p>' +
      (recent.length ? recent.map(function (e) { return entryRow(e, false); }).join("") : '<p class="muted">No entries yet. Try saying "aaj 200 ki sabzi li".</p>') +
      "</section>";
    if (data.entries.length) {
      html += '<p class="reset"><button class="link danger" data-click="reset">Clear all my data</button></p>';
    }
    return html;
  };

  views.add = function () {
    return '<h1>Add entry</h1><section class="card">' + quickAddForm("Speak or type in Hindi, Hinglish or English") +
      '<p class="muted">You can say more than one thing: "450 ka dhaaga liya aur 2000 silai ke mile".</p>' +
      '<p><a href="#manual">Fill a form instead</a></p></section>';
  };

  views.manual = function () {
    pending = [{ kind: "expense", amount: "", category: "other", note: "", date: todayKey() }];
    heard = "";
    return views.confirm();
  };

  views.confirm = function () {
    if (!pending.length) {
      setTimeout(function () { go("#home"); });
      return "";
    }
    var html = "<h1>Check and save</h1>" + (heard ? '<p class="muted">You said: "' + esc(heard) + '"</p>' : "") + '<form data-action="save-entries">';
    pending.forEach(function (p, i) {
      html += '<section class="card"><div class="fields">' +
        '<p><label>Type</label><select name="kind-' + i + '">' + options([["expense", "Expense"], ["income", "Income"]], p.kind) + "</select></p>" +
        '<p><label>Amount (₹)</label><input type="number" name="amount-' + i + '" min="1" step="0.01" value="' + esc(p.amount) + '"></p>' +
        '<p><label>Category</label><select name="category-' + i + '">' + options(CATEGORIES, p.category) + "</select></p>" +
        '<p><label>Date</label><input type="date" name="date-' + i + '" value="' + esc(p.date) + '"></p></div>' +
        '<p><label>Note</label><input type="text" name="note-' + i + '" maxlength="200" value="' + esc(p.note) + '"></p>' +
        '<label class="check"><input type="checkbox" name="skip-' + i + '"> Don\'t save this one</label></section>';
    });
    html += '<div class="row"><a href="#add" class="button secondary">Back</a><button type="submit">Save</button></div></form>';
    return html;
  };

  views.entries = function (kind) {
    var list = sortedEntries();
    if (kind === "income" || kind === "expense") list = list.filter(function (e) { return e.kind === kind; });
    var link = function (href, text, active) { return '<a href="' + href + '"' + (active ? ' class="active"' : "") + ">" + text + "</a>"; };
    return "<h1>Entries</h1><p class=\"filters\">" + link("#entries", "All", !kind) + link("#entries/income", "Income", kind === "income") +
      link("#entries/expense", "Expenses", kind === "expense") + '</p><section class="card">' +
      (list.length ? list.slice(0, 200).map(function (e) { return entryRow(e, true); }).join("") : '<p class="muted">Nothing here yet.</p>') +
      "</section>";
  };

  views.goals = function () {
    var html = "<h1>Savings goals</h1>";
    if (!data.goals.length) html += '<p class="muted">No goals yet. An emergency fund is a good first one.</p>';
    data.goals.forEach(function (g) {
      var pct = progress(g), monthly = monthlyNeeded(g);
      html += '<section class="card"><div class="goal-line"><strong>' + esc(g.name) + "</strong><span>" + inr(g.saved) + " / " + inr(g.target) + "</span></div>" +
        '<div class="bar"><span style="width:' + pct + '%"></span></div><p class="muted">' +
        (pct >= 100 ? "Done!" : inr(Math.max(g.target - g.saved, 0)) + " to go") +
        (monthly ? " · about " + inr(monthly) + " a month to reach it by " + longDate(g.date) : "") + "</p>" +
        '<div class="row"><form class="row" data-action="add-money" data-id="' + g.id + '">' +
        '<input type="number" name="amount" min="1" step="1" placeholder="Amount" required><button type="submit">Add money</button></form>' +
        '<button class="link danger" data-click="delete-goal" data-id="' + g.id + '">Delete</button></div></section>';
    });
    html += '<section class="card"><h2>New goal</h2><form data-action="new-goal">' +
      '<p><label>Name</label><input type="text" name="name" maxlength="80" required placeholder="Emergency fund, Diwali, school fees..."></p>' +
      '<p><label>Target amount (₹)</label><input type="number" name="target" min="1" step="1" required></p>' +
      '<p><label>By when (optional)</label><input type="date" name="date"></p>' +
      '<button type="submit">Create goal</button></form></section>';
    return html;
  };

  function calcField(name, label, value, min, max, step) {
    return '<p><label>' + label + '</label><input type="number" name="' + name + '" value="' + value + '" min="' + min + '" max="' + max + '" step="' + step + '" required></p>';
  }

  views.sip = function () {
    return '<h1>SIP calculator</h1><section class="card"><form data-live="sip">' +
      calcField("monthly", "Monthly amount (₹)", 500, 100, 1000000, 100) +
      calcField("rate", "Expected return (% per year)", 12, 0, 30, 0.5) +
      calcField("years", "Years", 5, 1, 40, 1) +
      '</form></section><section class="card highlight calc-result" id="calc-result"></section>' +
      '<p><a href="#lesson/what-is-sip">What is a SIP?</a></p>';
  };

  views.emi = function () {
    return '<h1>EMI calculator</h1><section class="card"><form data-live="emi">' +
      calcField("principal", "Loan amount (₹)", 50000, 1000, 10000000, 1000) +
      calcField("rate", "Interest rate (% per year)", 14, 0, 60, 0.5) +
      calcField("months", "Months", 12, 1, 360, 1) +
      '</form></section><section class="card highlight calc-result" id="calc-result"></section>' +
      '<p><a href="#lesson/loans-and-emi">Understanding loans and EMI</a></p>';
  };

  function liveCalc(form) {
    var out = document.getElementById("calc-result");
    if (!out) return;
    var v = function (name) { return parseFloat(form.elements[name].value); };
    if (!form.checkValidity()) {
      out.innerHTML = '<p class="muted">Please check the numbers above.</p>';
      return;
    }
    if (form.dataset.live === "sip") {
      var s = Calc.sip(v("monthly"), v("rate"), v("years"));
      out.innerHTML = '<p class="label">After ' + v("years") + " year" + (v("years") === 1 ? "" : "s") + '</p><p class="big">' + inr(s.total) + "</p>" +
        "<p>You put in " + inr(s.invested) + " · estimated growth " + inr(s.returns) + "</p>" +
        '<p class="muted">This is an estimate. Mutual fund returns are not guaranteed and can go down.</p>';
    } else {
      var e = Calc.emi(v("principal"), v("rate"), v("months"));
      out.innerHTML = '<p class="label">Monthly EMI</p><p class="big">' + inr(e.emi) + "</p>" +
        "<p>Total interest " + inr(e.interest) + " · total to repay " + inr(e.total) + "</p>" +
        '<p class="muted">Check that this EMI fits into your low weeks, not only your good ones.</p>';
    }
  }

  views.portfolio = function () {
    var invested = 0, current = 0;
    data.holdings.forEach(function (h) { invested += h.invested; current += h.current; });
    var gain = current - invested;
    var pct = invested ? Math.round(gain / invested * 1000) / 10 : null;
    var html = '<h1>Investments</h1><section class="grid">' +
      '<div class="card"><p class="label">Invested</p><p class="big">' + inr(invested) + "</p></div>" +
      '<div class="card"><p class="label">Current value</p><p class="big">' + inr(current) + "</p>" +
      (pct !== null ? '<p class="' + (gain >= 0 ? "income" : "expense") + '">' + inr(gain) + " (" + pct + "%)</p>" : "") +
      '</div></section><section class="card">';
    if (!data.holdings.length) html += '<p class="muted">Add your FDs, SIPs, gold or other savings to see them in one place.</p>';
    data.holdings.forEach(function (h) {
      html += '<div class="entry"><div><strong>' + esc(h.name) + '</strong> <span class="muted">' + esc(LABELS[h.kind]) + "</span></div>" +
        '<div class="row"><span>' + inr(h.invested) + " → " + inr(h.current) + "</span>" +
        '<button class="link danger" data-click="delete-holding" data-id="' + h.id + '">Remove</button></div></div>';
    });
    html += '</section><section class="card"><h2>Add investment</h2><form data-action="new-holding">' +
      '<p><label>Name</label><input type="text" name="name" maxlength="80" required></p>' +
      '<p><label>Type</label><select name="kind">' + options(HOLDING_KINDS, "mf") + "</select></p>" +
      '<p><label>Amount invested (₹)</label><input type="number" name="invested" min="0" step="1" required></p>' +
      '<p><label>Current value (₹)</label><input type="number" name="current" min="0" step="1" required></p>' +
      '<button type="submit">Add</button></form></section>';
    return html;
  };

  views.vault = async function () {
    if (!Vault.supported()) {
      return '<section class="card narrow"><h1>Private vault</h1><p>Your browser can\'t encrypt data here. Open the app over https (for example the GitHub Pages link) to use the vault.</p></section>';
    }
    var pinInput = function (name, label) {
      return '<p><label>' + label + '</label><input type="password" name="' + name + '" inputmode="numeric" autocomplete="off" pattern="[0-9]{4,6}" required></p>';
    };
    if (!data.vault) {
      return '<section class="card narrow"><h1>Private vault</h1>' +
        "<p>A separate space for your own savings, locked with its own PIN. Use a PIN that is different from your phone lock.</p>" +
        '<p class="muted">Everything here is encrypted on your phone with your PIN. If you forget it, the vault cannot be opened.</p>' +
        '<form data-action="vault-setup">' + pinInput("pin", "Vault PIN (4 to 6 digits)") + pinInput("pin2", "Repeat PIN") +
        '<button type="submit">Create vault</button></form></section>';
    }
    if (!vaultKey) {
      return '<section class="card narrow"><h1>Open vault</h1><form data-action="vault-unlock">' + pinInput("pin", "Vault PIN") +
        '<button type="submit">Open</button></form></section>';
    }
    var items = await Promise.all(data.vault.items.map(function (box) {
      return Vault.decrypt(vaultKey, box).then(function (v) { return Object.assign({ id: box.id }, v); }).catch(function () { return null; });
    }));
    items = items.filter(Boolean);
    var total = items.reduce(function (a, i) { return a + Number(i.amount); }, 0);
    var html = '<div class="goal-line"><h1>Private vault</h1><button class="secondary" data-click="vault-lock">Lock now</button></div>' +
      '<section class="card highlight"><p class="label">Total in vault</p><p class="big">' + inr(total) + "</p>" +
      '<p class="muted">Locks by itself after 10 minutes.</p></section><section class="card">';
    if (!items.length) html += '<p class="muted">Nothing saved yet.</p>';
    items.forEach(function (i) {
      html += '<div class="entry"><span>' + esc(i.label) + ' <span class="muted">· ' + shortDate(i.date) + "</span></span>" +
        '<div class="row"><strong>' + inr(i.amount) + '</strong><button class="link danger" data-click="vault-remove" data-id="' + i.id + '">Remove</button></div></div>';
    });
    html += '</section><section class="card"><h2>Add to vault</h2><form data-action="vault-add">' +
      '<p><label>What is it?</label><input type="text" name="label" maxlength="100" required placeholder="Emergency cash, gold, personal savings..."></p>' +
      '<p><label>Amount (₹)</label><input type="number" name="amount" min="0" step="1" required></p>' +
      '<button type="submit">Save</button></form></section>';
    return html;
  };

  views.learn = function () {
    var done = data.lessonsDone;
    var count = LESSONS.filter(function (l) { return done.indexOf(l.slug) >= 0; }).length;
    return '<h1>Learn</h1><p class="muted">' + count + " of " + LESSONS.length + " lessons done</p>" +
      LESSONS.map(function (l) {
        return '<a class="card lesson" href="#lesson/' + l.slug + '"><div><strong>' + esc(l.title) + '</strong><p class="muted">' +
          esc(l.hindi) + " · " + l.minutes + " min</p></div>" + (done.indexOf(l.slug) >= 0 ? '<span class="done">Done</span>' : "") + "</a>";
      }).join("");
  };

  views.lesson = function (slug) {
    var l = findLesson(slug);
    if (!l) return views.learn();
    if (data.lessonsDone.indexOf(slug) < 0) {
      data.lessonsDone.push(slug);
      save();
    }
    return '<article class="card"><h1>' + esc(l.title) + '</h1><p class="muted">' + esc(l.hindi) + "</p>" +
      l.body.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
      (l.link ? '<p><a href="#' + l.link + '" class="button">Try the calculator</a></p>' : "") +
      '</article><p><a href="#learn">All lessons</a></p>';
  };

  var actions = {};

  actions.parse = function (form) {
    var text = form.elements.text.value.trim();
    if (!text) return;
    var items = Parser.parse(text);
    heard = text;
    if (!items.length) {
      notify("Couldn't find an amount in that. Please fill it in below.", "warning");
      pending = [{ kind: "expense", amount: "", category: "other", note: text.slice(0, 200), date: todayKey() }];
    } else {
      pending = items.map(function (i) { return Object.assign({ date: todayKey() }, i); });
    }
    go("#confirm");
  };

  actions["save-entries"] = function (form) {
    var f = form.elements;
    pending = pending.map(function (p, i) {
      return {
        kind: f["kind-" + i].value,
        amount: f["amount-" + i].value,
        category: f["category-" + i].value,
        date: f["date-" + i].value || todayKey(),
        note: f["note-" + i].value.trim(),
        skip: f["skip-" + i].checked
      };
    });
    var keep = pending.filter(function (p) { return !p.skip; });
    if (keep.some(function (p) { return !(parseFloat(p.amount) > 0); })) {
      notify("Every entry needs an amount more than zero.", "warning");
      render();
      return;
    }
    keep.forEach(function (p) {
      data.entries.push({ id: uid(), kind: p.kind, amount: parseFloat(p.amount), category: p.category, note: p.note, date: p.date, created: Date.now() });
    });
    save();
    pending = [];
    if (keep.length) notify("Saved " + keep.length + " " + (keep.length === 1 ? "entry" : "entries") + ".");
    go("#home");
  };

  actions["new-goal"] = function (form) {
    var f = form.elements;
    data.goals.push({ id: uid(), name: f.name.value.trim(), target: parseFloat(f.target.value), saved: 0, date: f.date.value || null });
    save();
    notify("Goal added.");
    render();
  };

  actions["add-money"] = function (form) {
    var goal = data.goals.filter(function (g) { return g.id === form.dataset.id; })[0];
    if (!goal) return;
    goal.saved += parseFloat(form.elements.amount.value);
    save();
    notify(goal.saved >= goal.target ? "You reached your goal '" + goal.name + "'!" : "Added to '" + goal.name + "'.");
    render();
  };

  actions["new-holding"] = function (form) {
    var f = form.elements;
    data.holdings.push({ id: uid(), name: f.name.value.trim(), kind: f.kind.value, invested: parseFloat(f.invested.value), current: parseFloat(f.current.value) });
    save();
    render();
  };

  function startLockTimer() {
    clearTimeout(lockTimer);
    lockTimer = setTimeout(function () {
      vaultKey = null;
      if (location.hash === "#vault") render();
    }, 10 * 60 * 1000);
  }

  actions["vault-setup"] = async function (form) {
    var pin = form.elements.pin.value;
    if (pin !== form.elements.pin2.value) {
      notify("PINs don't match.", "warning");
      render();
      return;
    }
    var made = await Vault.create(pin);
    data.vault = made.vault;
    vaultKey = made.key;
    save();
    startLockTimer();
    notify("Your vault is ready. Remember this PIN, it cannot be reset.");
    render();
  };

  actions["vault-unlock"] = async function (form) {
    var key = await Vault.unlock(form.elements.pin.value, data.vault);
    if (!key) {
      notify("Wrong PIN.", "warning");
    } else {
      vaultKey = key;
      startLockTimer();
    }
    render();
  };

  actions["vault-add"] = async function (form) {
    if (!vaultKey) return render();
    var box = await Vault.encrypt(vaultKey, { label: form.elements.label.value.trim(), amount: parseFloat(form.elements.amount.value), date: todayKey() });
    box.id = uid();
    data.vault.items.unshift(box);
    save();
    render();
  };

  var clicks = {};

  clicks.demo = function () {
    data = Store.demo(data);
    save();
    notify("Sample data loaded. This is six weeks of a home tailor's income and expenses.");
    render();
  };

  clicks.reset = function () {
    if (!confirm("This deletes all your entries, goals, investments and the vault from this device. Continue?")) return;
    Store.clear();
    data = Store.load();
    vaultKey = null;
    notify("All data cleared.", "info");
    go("#home");
  };

  clicks["delete-entry"] = function (btn) {
    if (!confirm("Delete this entry?")) return;
    data.entries = data.entries.filter(function (e) { return e.id !== btn.dataset.id; });
    save();
    render();
  };

  clicks["delete-goal"] = function (btn) {
    if (!confirm("Delete this goal?")) return;
    data.goals = data.goals.filter(function (g) { return g.id !== btn.dataset.id; });
    save();
    render();
  };

  clicks["delete-holding"] = function (btn) {
    data.holdings = data.holdings.filter(function (h) { return h.id !== btn.dataset.id; });
    save();
    render();
  };

  clicks["vault-lock"] = function () {
    vaultKey = null;
    clearTimeout(lockTimer);
    go("#home");
  };

  clicks["vault-remove"] = function (btn) {
    data.vault.items = data.vault.items.filter(function (i) { return i.id !== btn.dataset.id; });
    save();
    render();
  };

  main.addEventListener("submit", function (e) {
    var form = e.target;
    if (form.dataset.live) {
      e.preventDefault();
      return;
    }
    var action = actions[form.dataset.action];
    if (!action) return;
    e.preventDefault();
    action(form);
  });

  main.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-click]");
    if (btn && clicks[btn.dataset.click]) clicks[btn.dataset.click](btn);
  });

  main.addEventListener("input", function (e) {
    if (e.target.form && e.target.form.dataset.live) liveCalc(e.target.form);
  });

  function setupVoice() {
    var Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    main.querySelectorAll("[data-voice]").forEach(function (button) {
      var field = document.getElementById(button.dataset.voice);
      if (!Recognition || !field) {
        button.hidden = true;
        return;
      }
      var label = button.textContent;
      var rec = new Recognition();
      rec.lang = "hi-IN";
      rec.interimResults = false;
      var listening = false;
      button.addEventListener("click", function () {
        if (listening) rec.stop();
        else rec.start();
      });
      rec.onstart = function () {
        listening = true;
        button.classList.add("listening");
        button.textContent = "Listening... tap to stop";
      };
      rec.onend = function () {
        listening = false;
        button.classList.remove("listening");
        button.textContent = label;
      };
      rec.onresult = function (event) {
        var text = Array.from(event.results).map(function (r) { return r[0].transcript; }).join(" ");
        field.value = field.value ? field.value + " " + text : text;
      };
      rec.onerror = function (event) {
        if (event.error === "not-allowed") alert("Please allow microphone access to use voice input.");
      };
    });
  }

  async function render() {
    var parts = (location.hash.slice(1) || "home").split("/");
    var name = views[parts[0]] ? parts[0] : "home";
    var html = await views[name](parts[1]);
    if (flash) {
      html = '<p class="msg msg-' + flash.type + '">' + esc(flash.text) + "</p>" + html;
      flash = null;
    }
    main.innerHTML = html;
    var tab = { confirm: "add", manual: "add", lesson: "learn" }[name] || name;
    document.querySelectorAll(".tabs a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + tab);
    });
    setupVoice();
    var live = main.querySelector("form[data-live]");
    if (live) liveCalc(live);
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", render);
  render();

  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
})();

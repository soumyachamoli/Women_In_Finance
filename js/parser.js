(function (root) {
  var NUMBER_WORDS = {
    ek: 1, "एक": 1, do: 2, "दो": 2, teen: 3, "तीन": 3,
    char: 4, chaar: 4, "चार": 4, paanch: 5, panch: 5, "पांच": 5, "पाँच": 5,
    chhe: 6, chhah: 6, "छह": 6, saat: 7, "सात": 7, aath: 8, "आठ": 8,
    nau: 9, "नौ": 9, das: 10, "दस": 10, bees: 20, "बीस": 20,
    pachas: 50, pachaas: 50, "पचास": 50
  };
  var FRACTIONS = { dedh: 1.5, "डेढ़": 1.5, "डेढ": 1.5, dhai: 2.5, dhaai: 2.5, "ढाई": 2.5 };
  var HALF_UP = ["saade", "sade", "साढ़े", "साढे"];
  var MULTIPLIERS = {
    sau: 100, "सौ": 100, hundred: 100,
    hazaar: 1000, hazar: 1000, hajar: 1000, hajaar: 1000, "हज़ार": 1000, "हजार": 1000, thousand: 1000,
    lakh: 100000, "लाख": 100000
  };

  var INCOME_WORDS = [
    "mila", "mile", "mili", "aaye", "aye", "aaya", "aya", "kamaye", "kamaya", "kamai",
    "salary", "tankhwah", "becha", "bechi", "received", "got", "earned", "income",
    "मिला", "मिले", "मिली", "आए", "आये", "आया", "कमाए", "कमाया", "कमाई", "सैलरी", "तनख्वाह", "बेचा", "बेची"
  ];
  var EXPENSE_WORDS = [
    "liya", "li", "liye", "kharida", "kharidi", "kharide", "diya", "di", "diye", "kharcha", "kharch",
    "bhara", "bhari", "spent", "paid", "bought",
    "लिया", "ली", "लिए", "खरीदा", "खरीदी", "खरीदे", "दिया", "दी", "दिए", "खर्च", "खर्चा", "भरा", "भरी"
  ];

  var CATEGORY_WORDS = {
    materials: ["dhaag", "dhag", "kapd", "kapr", "button", "sui", "maal", "stock", "धाग", "कपड़", "कपड", "बटन", "सुई", "माल"],
    food: ["sabzi", "sabji", "ration", "doodh", "dudh", "atta", "aata", "chawal", "daal", "kirana", "phal",
      "सब्ज़ी", "सब्जी", "राशन", "दूध", "आटा", "चावल", "दाल", "किराना", "फल"],
    bills: ["bijli", "recharge", "bill", "cylinder", "kiraya", "rent", "wifi", "बिजली", "रिचार्ज", "बिल", "सिलेंडर", "किराया"],
    transport: ["auto", "bus", "rickshaw", "petrol", "tempo", "metro", "ऑटो", "बस", "रिक्शा", "पेट्रोल", "टेम्पो"],
    health: ["dawai", "dawa", "dava", "doctor", "hospital", "medicine", "दवाई", "दवा", "डॉक्टर", "अस्पताल"],
    education: ["fees", "school", "kitab", "tuition", "फीस", "स्कूल", "किताब", "ट्यूशन"],
    household: ["bartan", "sabun", "saabun", "safai", "बर्तन", "साबुन", "सफाई"]
  };

  var PHRASES = [
    ["chai samose pe kharcha", "food"], ["mandi se tamatar pyaaz", "food"], ["bachon ke liye biscuit", "food"],
    ["anda aur bread", "food"], ["masala aur namak", "food"], ["cheeni ka packet", "food"], ["chicken liya", "food"],
    ["paneer kharida", "food"], ["aam aur kele", "food"], ["चाय समोसा", "food"], ["टमाटर प्याज़", "food"],
    ["चीनी का पैकेट", "food"], ["अंडे और ब्रेड", "food"],
    ["zip aur lace", "materials"], ["blouse ka astar", "materials"], ["silai machine ki needle", "materials"],
    ["kadhai ka resham", "materials"], ["dukaan ke liye packing", "materials"], ["beads aur moti", "materials"],
    ["tiffin ke dabbe", "materials"], ["mehendi cone", "materials"], ["parlour ka saamaan", "materials"],
    ["ज़िप और लेस", "materials"], ["रेशम का धागा", "materials"], ["मोती और बीड्स", "materials"], ["पैकिंग का सामान", "materials"],
    ["light ka paisa", "bills"], ["mobile ka plan", "bills"], ["gas booking", "bills"], ["paani ka tanker", "bills"],
    ["ghar ka bhada", "bills"], ["dth chalu karaya", "bills"], ["internet ka paisa", "bills"], ["मोबाइल प्लान", "bills"],
    ["गैस बुकिंग", "bills"], ["पानी का टैंकर", "bills"], ["मकान का भाड़ा", "bills"],
    ["shared auto se mandi", "transport"], ["train ka ticket", "transport"], ["e rickshaw ka bhada", "transport"],
    ["scooty mein tel", "transport"], ["bus pass banwaya", "transport"], ["ola uber", "transport"],
    ["ट्रेन का टिकट", "transport"], ["स्कूटी में तेल", "transport"], ["ई रिक्शा", "transport"],
    ["bukhar ki goli", "health"], ["chashma banwaya", "health"], ["dant ka ilaaj", "health"], ["khoon ki jaanch", "health"],
    ["bachche ka teeka", "health"], ["बुखार की गोली", "health"], ["चश्मा बनवाया", "health"], ["खून की जांच", "health"],
    ["दांत का इलाज", "health"],
    ["bachche ki copy pencil", "education"], ["school ki dress", "education"], ["exam form", "education"],
    ["coaching ka mahina", "education"], ["computer class", "education"], ["स्कूल की ड्रेस", "education"],
    ["कॉपी पेंसिल", "education"], ["परीक्षा फॉर्म", "education"], ["कोचिंग की फीस", "education"],
    ["jhaadu pocha", "household"], ["balti aur mug", "household"], ["parde silwaye", "household"], ["bedsheet li", "household"],
    ["surf aur vim", "household"], ["pankha theek karaya", "household"], ["झाड़ू पोछा", "household"],
    ["बाल्टी और मग", "household"], ["चादर ली", "household"], ["पंखा ठीक कराया", "household"],
    ["shaadi ka gift", "other"], ["mandir mein daan", "other"], ["kisi ko udhaar diya", "other"],
    ["bachon ki pocket money", "other"], ["शादी का तोहफा", "other"], ["मंदिर में दान", "other"], ["उधार दिया", "other"]
  ];

  var SPLIT_RE = /\s+(?:aur|और|tatha)\s+|(?<!\d),|,(?!\d)|[;।]/;
  var TOKEN_RE = /\d[\d,]*(?:\.\d+)?k?|[^\s\d,.!?।₹]+/g;

  function tokenize(text) {
    return text.toLowerCase().match(TOKEN_RE) || [];
  }

  function isDigit(tok) {
    return /^\d/.test(tok);
  }

  function digitValue(tok) {
    if (tok.slice(-1) === "k") return parseFloat(tok.slice(0, -1).replace(/,/g, "")) * 1000;
    return parseFloat(tok.replace(/,/g, ""));
  }

  function has(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function isNumberish(tok) {
    return isDigit(tok) || has(NUMBER_WORDS, tok) || has(FRACTIONS, tok) || HALF_UP.indexOf(tok) >= 0 || has(MULTIPLIERS, tok);
  }

  function readNumber(tokens, start) {
    var total = 0, current = 0, half = false, hadDigit = false, hadMult = false, j = start;
    while (j < tokens.length) {
      var tok = tokens[j];
      if (isDigit(tok)) {
        if (current) break;
        current = digitValue(tok);
        hadDigit = true;
      } else if (has(NUMBER_WORDS, tok)) {
        current += NUMBER_WORDS[tok];
      } else if (has(FRACTIONS, tok)) {
        current += FRACTIONS[tok];
      } else if (HALF_UP.indexOf(tok) >= 0) {
        half = true;
        j++;
        continue;
      } else if (has(MULTIPLIERS, tok)) {
        hadMult = true;
        var m = MULTIPLIERS[tok];
        if (current === 0) current = 1;
        if (m >= 1000) {
          total += current * m;
          current = 0;
        } else {
          current *= m;
        }
      } else {
        break;
      }
      if (half && (has(NUMBER_WORDS, tok) || isDigit(tok))) {
        current += 0.5;
        half = false;
      }
      j++;
    }
    return { value: total + current, used: j - start, hadDigit: hadDigit, hadMult: hadMult };
  }

  function findAmount(tokens) {
    var i = 0;
    while (i < tokens.length) {
      if (isNumberish(tokens[i])) {
        var r = readNumber(tokens, i);
        if (r.value && (r.hadDigit || r.hadMult || r.value >= 10)) return r.value;
        i += Math.max(r.used, 1);
      } else {
        i++;
      }
    }
    return null;
  }

  function findKind(tokens) {
    var income = tokens.some(function (t) { return INCOME_WORDS.indexOf(t) >= 0; });
    var expense = tokens.some(function (t) { return EXPENSE_WORDS.indexOf(t) >= 0; });
    return income && !expense ? "income" : "expense";
  }

  function matches(token, word) {
    if (token === word) return true;
    if (!/^[\x00-\x7F]+$/.test(word) || word.length >= 4) return token.indexOf(word) === 0;
    return false;
  }

  function grams(text) {
    var s = " " + text.toLowerCase().replace(/[\d₹,.]+/g, " ").replace(/\s+/g, " ").trim() + " ";
    var chars = Array.from(s);
    var out = [];
    for (var n = 2; n <= 4; n++) {
      for (var i = 0; i + n <= chars.length; i++) out.push(chars.slice(i, i + n).join(""));
    }
    return out;
  }

  var model = null;

  function train() {
    var counts = {}, totals = {}, docs = {}, vocab = {};
    PHRASES.forEach(function (p) {
      var c = p[1];
      counts[c] = counts[c] || {};
      totals[c] = totals[c] || 0;
      docs[c] = (docs[c] || 0) + 1;
      grams(p[0]).forEach(function (g) {
        counts[c][g] = (counts[c][g] || 0) + 1;
        totals[c]++;
        vocab[g] = true;
      });
    });
    return { counts: counts, totals: totals, docs: docs, vocab: vocab, vocabSize: Object.keys(vocab).length, n: PHRASES.length };
  }

  function guessCategory(text) {
    if (!model) model = train();
    var gs = grams(text).filter(function (g) { return model.vocab[g]; });
    if (gs.length < 3) return null;
    var scores = {};
    Object.keys(model.counts).forEach(function (c) {
      var s = Math.log(model.docs[c] / model.n);
      gs.forEach(function (g) {
        s += Math.log(((model.counts[c][g] || 0) + 1) / (model.totals[c] + model.vocabSize));
      });
      scores[c] = s;
    });
    var cats = Object.keys(scores);
    var best = cats.reduce(function (a, b) { return scores[a] >= scores[b] ? a : b; });
    var sum = 0;
    cats.forEach(function (c) { sum += Math.exp(scores[c] - scores[best]); });
    return 1 / sum >= 0.6 ? best : null;
  }

  function findCategory(tokens, text, kind) {
    if (kind === "income") return "work";
    var cats = Object.keys(CATEGORY_WORDS);
    for (var i = 0; i < cats.length; i++) {
      var words = CATEGORY_WORDS[cats[i]];
      for (var j = 0; j < tokens.length; j++) {
        var tok = tokens[j];
        if (words.some(function (w) { return matches(tok, w); })) return cats[i];
      }
    }
    return guessCategory(text) || "other";
  }

  function parse(text) {
    var results = [];
    (text || "").split(SPLIT_RE).forEach(function (part) {
      part = (part || "").trim();
      if (!part) return;
      var tokens = tokenize(part);
      var amount = findAmount(tokens);
      if (!amount) return;
      var kind = findKind(tokens);
      results.push({
        amount: Math.round(amount * 100) / 100,
        kind: kind,
        category: findCategory(tokens, part, kind),
        note: part.slice(0, 200)
      });
    });
    return results;
  }

  var api = { parse: parse, guessCategory: guessCategory };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Parser = api;
})(this);

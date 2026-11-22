/* Dice Roller — d4–d20, 1–6 dice, animated rolls, totals, history. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  var diceCountInput = $("dice-count");
  var diceCountLabel = $("dice-count-label");
  var rollBtn = $("roll-btn");
  var clearHistoryBtn = $("clear-history-btn");
  var resultEmpty = $("result-empty");
  var resultBody = $("result-body");
  var diceStage = $("dice-stage");
  var rollSummary = $("roll-summary");
  var rollTotal = $("roll-total");
  var rollNote = $("roll-note");
  var historyList = $("history-list");
  var historyEmpty = $("history-empty");
  var historyCount = $("history-count");
  var toastEl = $("toast");

  var STORAGE_KEY = "dice-roller-history-v1";
  var MAX_HISTORY = 50;
  var sides = 6;
  var rolling = false;
  var toastTimer = null;
  var history = [];

  /* ---------- Pure helpers (also unit-tested in node) ---------- */
  function rollOne(sidesCount, rand) {
    var r = rand || Math.random;
    return Math.floor(r() * sidesCount) + 1;
  }

  function rollDice(count, sidesCount, rand) {
    var values = [];
    for (var i = 0; i < count; i++) values.push(rollOne(sidesCount, rand));
    return values;
  }

  function rollTotalOf(values) {
    return values.reduce(function (a, b) { return a + b; }, 0);
  }

  function rollNoteFor(values, sidesCount) {
    if (sidesCount === 20 && values.length === 1) {
      if (values[0] === 20) return "🎉 Natural 20 — critical hit!";
      if (values[0] === 1) return "💥 Natural 1 — critical fail!";
    }
    var max = values.length * sidesCount;
    var total = rollTotalOf(values);
    if (total === max) return "Maximum roll — every die at its best!";
    if (total === values.length) return "Minimum roll — every die at its worst!";
    return "";
  }

  /* ---------- Toast ---------- */
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }

  /* ---------- History ---------- */
  function saveHistory() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch (e) { /* ignore */ }
  }

  function loadHistory() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) history = parsed;
      }
    } catch (e) { history = []; }
  }

  function renderHistory() {
    historyList.innerHTML = "";
    historyCount.textContent = history.length + (history.length === 1 ? " roll" : " rolls");
    historyEmpty.classList.toggle("hidden", history.length > 0);
    history.forEach(function (entry) {
      var li = document.createElement("li");
      li.className = "history-item";
      var dice = document.createElement("span");
      dice.className = "hist-dice";
      dice.textContent = entry.count + "d" + entry.sides;
      var values = document.createElement("span");
      values.className = "hist-values";
      values.innerHTML = entry.values.map(function (v) { return "<strong>" + v + "</strong>"; }).join(" + ");
      var total = document.createElement("span");
      total.className = "hist-total";
      total.textContent = "= " + entry.total;
      var time = document.createElement("span");
      time.className = "hist-time";
      time.textContent = new Date(entry.at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      li.appendChild(dice);
      li.appendChild(values);
      li.appendChild(total);
      li.appendChild(time);
      historyList.appendChild(li);
    });
  }

  function addToHistory(values) {
    history.unshift({
      count: values.length,
      sides: sides,
      values: values,
      total: rollTotalOf(values),
      at: Date.now()
    });
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    saveHistory();
    renderHistory();
  }

  /* ---------- Rolling ---------- */
  function makeDieFace(value, sidesCount, extraClass) {
    var el = document.createElement("span");
    el.className = "die-face" + (extraClass ? " " + extraClass : "");
    el.textContent = value;
    el.setAttribute("aria-hidden", "true");
    if (sidesCount === 20 && value === 20) el.classList.add("crit");
    if (sidesCount === 20 && value === 1) el.classList.add("fumble");
    return el;
  }

  function roll() {
    if (rolling) return;
    rolling = true;
    rollBtn.disabled = true;

    var count = parseInt(diceCountInput.value, 10) || 1;
    var finalValues = rollDice(count, sides);
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    resultEmpty.classList.add("hidden");
    resultBody.classList.remove("hidden");
    diceStage.innerHTML = "";
    rollSummary.textContent = count + "d" + sides;
    rollTotal.textContent = "…";
    rollNote.textContent = "";

    // Placeholder faces that cycle random values during the tumble.
    var faces = finalValues.map(function () {
      var f = makeDieFace(rollOne(sides), sides, "rolling");
      diceStage.appendChild(f);
      return f;
    });

    if (reducedMotion) {
      settle(finalValues, faces, count);
      return;
    }

    var ticks = 0;
    var maxTicks = 7;
    var shuffle = setInterval(function () {
      ticks++;
      faces.forEach(function (f) { f.textContent = rollOne(sides); });
      if (ticks >= maxTicks) {
        clearInterval(shuffle);
        settle(finalValues, faces, count);
      }
    }, 80);
  }

  function settle(finalValues, faces, count) {
    faces.forEach(function (f, i) {
      f.textContent = finalValues[i];
      f.classList.remove("rolling");
      f.classList.add("landed");
      if (sides === 20 && finalValues[i] === 20) f.classList.add("crit");
      if (sides === 20 && finalValues[i] === 1) f.classList.add("fumble");
    });
    var total = rollTotalOf(finalValues);
    rollTotal.textContent = count === 1 ? String(total) : "Total: " + total;
    var note = rollNoteFor(finalValues, sides);
    rollNote.innerHTML = note ? "<strong>" + note + "</strong>" : "";
    addToHistory(finalValues);
    rolling = false;
    rollBtn.disabled = false;
  }

  /* ---------- Events ---------- */
  rollBtn.addEventListener("click", roll);

  document.addEventListener("keydown", function (e) {
    if (e.code === "Space" && !e.target.matches("input, textarea, select, button")) {
      e.preventDefault();
      roll();
    }
  });

  document.querySelectorAll(".die-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".die-btn").forEach(function (b) {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      sides = parseInt(btn.getAttribute("data-sides"), 10);
    });
  });

  diceCountInput.addEventListener("input", function () {
    diceCountLabel.textContent = diceCountInput.value;
  });

  clearHistoryBtn.addEventListener("click", function () {
    if (history.length === 0) { showToast("History is already empty."); return; }
    history = [];
    saveHistory();
    renderHistory();
    showToast("Roll history cleared.");
  });

  /* ---------- Header / nav / reveal ---------- */
  var header = $("site-header");
  window.addEventListener("scroll", function () {
    header.classList.toggle("scrolled", window.scrollY > 8);
  }, { passive: true });

  var navToggle = $("nav-toggle");
  var mobileMenu = $("mobile-menu");
  navToggle.addEventListener("click", function () {
    var open = mobileMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { mobileMenu.classList.remove("open"); });
  });

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  $("year").textContent = new Date().getFullYear();

  /* ---------- Init ---------- */
  loadHistory();
  renderHistory();

  /* Expose pure helpers for node-based verification. */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { rollOne: rollOne, rollDice: rollDice, rollTotalOf: rollTotalOf, rollNoteFor: rollNoteFor };
  }
})();

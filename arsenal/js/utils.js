/*
  Small utilities that libraries like Lodash, Moment and store.js are often added for.

    const { debounce, throttle, formatDate, formatMoney, storage } = VWA;
*/
(function () {
  "use strict";

  const VWA = (window.VWA = window.VWA || {});

  /**
   * Waits until calls stop for `wait` ms, then runs fn once.
   * Use it for search-as-you-type and window resize.
   *   input.addEventListener("input", debounce(search, 300));
   */
  VWA.debounce = (fn, wait = 250) => {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  };

  /**
   * Runs fn at most once every `wait` ms. Use it for scroll and mousemove handlers.
   */
  VWA.throttle = (fn, wait = 100) => {
    let last = 0;
    let timer;
    return function (...args) {
      const remaining = wait - (Date.now() - last);
      clearTimeout(timer);
      if (remaining <= 0) {
        last = Date.now();
        fn.apply(this, args);
      } else {
        timer = setTimeout(() => {
          last = Date.now();
          fn.apply(this, args);
        }, remaining);
      }
    };
  };

  /** await sleep(500) pauses an async function for half a second. */
  VWA.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /** Short unique id, good enough for list items and form field ids. */
  VWA.uid = (prefix = "id") => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  /** Keeps a number between min and max. */
  VWA.clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  /* ---------- Formatting with Intl (built into every browser) ---------- */

  VWA.locale = document.documentElement.lang || navigator.language || "en";

  /* new Date("2026-10-25") means midnight UTC, which is still Oct 24 west of London.
     Date-only strings are read as local midnight instead. */
  const toDate = (value) =>
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00`) : new Date(value);

  /** formatDate(new Date()) -> "Oct 23, 2026". Accepts dates, timestamps and "2026-10-25" strings. */
  VWA.formatDate = (date, options = { dateStyle: "medium" }) =>
    new Intl.DateTimeFormat(VWA.locale, options).format(toDate(date));

  /** formatNumber(1234567.8) -> "1,234,567.8" */
  VWA.formatNumber = (value, options) => new Intl.NumberFormat(VWA.locale, options).format(value);

  /** formatMoney(49.9, "EUR") -> "€49.90" */
  VWA.formatMoney = (value, currency = "EUR") =>
    new Intl.NumberFormat(VWA.locale, { style: "currency", currency }).format(value);

  /** timeAgo(someDate) -> "3 minutes ago", "in 2 days" */
  VWA.timeAgo = (date) => {
    const seconds = Math.round((toDate(date) - Date.now()) / 1000);
    const units = [
      ["year", 31536000],
      ["month", 2592000],
      ["week", 604800],
      ["day", 86400],
      ["hour", 3600],
      ["minute", 60],
    ];
    const format = new Intl.RelativeTimeFormat(VWA.locale, { numeric: "auto" });
    for (const [unit, size] of units) {
      if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
    }
    return format.format(seconds, "second");
  };

  /* ---------- localStorage with JSON ---------- */
  /* localStorage only stores strings. These helpers store any JSON value and
     never throw (private mode or a full quota just returns the fallback). */

  VWA.storage = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* storage full or blocked: the app keeps working without saving */
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* same as above */
      }
    },
  };
})();

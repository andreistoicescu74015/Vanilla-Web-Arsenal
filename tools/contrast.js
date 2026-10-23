/* Contrast checker: WCAG 2.2 ratio, pass/fail per criterion, a suggested fix, and a token audit. */
(function () {
  "use strict";

  const { $, on, h, icon, createStore, debounce } = VWA;

  /* ---------- Color math ---------- */

  // Any CSS color string -> [r, g, b, a] in 0-255 (alpha 0-1). A 1x1 canvas does the parsing,
  // so names, hsl(), oklch() and color-mix() all work.
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  function parseColor(value) {
    if (!value || !CSS.supports("color", value)) return null;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  }

  // A see-through color is judged by what you actually see: the color painted over its background
  const flatten = ([r, g, b, a], [br, bg, bb] = [255, 255, 255]) =>
    [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a)].map(Math.round);

  const linear = (channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };

  /** WCAG 2.2 contrast ratio of two [r, g, b] colors, from 1 to 21. */
  function contrast(a, b) {
    const luminance = ([r, g, bl]) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(bl);
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
  }

  // Two decimals, except when rounding would hide a fail: 4.499 shows as 4.499, not 4.50
  function formatRatio(ratio) {
    let text = ratio.toFixed(2);
    for (const threshold of [3, 4.5, 7]) {
      if (ratio < threshold && Number(text) >= threshold) text = (Math.floor(ratio * 1000) / 1000).toFixed(3);
    }
    return `${text}:1`;
  }

  const toHex = (rgb) => `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;

  // sRGB <-> OKLab (Bjorn Ottosson's matrices), used to change lightness without shifting the hue
  function toOklab(rgb) {
    const [r, g, b] = rgb.map(linear);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ];
  }

  function fromOklab([L, A, B]) {
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
    const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
    const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ].map((v) => {
      const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
      return Math.round(Math.min(1, Math.max(0, c)) * 255);
    });
  }

  /** Closest color with the same hue that reaches `target` against bg, or null. */
  function suggestFix(fg, bg, target) {
    const [L, A, B] = toOklab(fg);
    let best = null;
    for (const direction of [-1, 1]) {
      for (let step = 1; step <= 200; step++) {
        const lightness = L + direction * step * 0.005;
        if (lightness < 0 || lightness > 1) break;
        const candidate = fromOklab([lightness, A, B]);
        if (contrast(candidate, bg) >= target) {
          if (!best || step < best.step) best = { step, color: candidate, direction };
          break;
        }
      }
    }
    return best;
  }

  /* ---------- State ---------- */

  const store = createStore({ fg: "#767676", bg: "#ffffff", target: "4.5" }, { persist: "vwa-contrast" });

  const CHECKS = [
    { name: "AA normal text", min: 4.5, text: "Body text, labels and links. The minimum for most text (WCAG 1.4.3)." },
    { name: "AA large text", min: 3, text: "Text at least 24px, or 18.5px bold. Most headings qualify (WCAG 1.4.3)." },
    { name: "AAA normal text", min: 7, text: "The enhanced level for body text (WCAG 1.4.6)." },
    { name: "AAA large text", min: 4.5, text: "The enhanced level for large text (WCAG 1.4.6)." },
    { name: "UI components", min: 3, text: "Input borders, icons, focus rings and chart lines against the colors next to them (WCAG 1.4.11)." },
  ];

  // Pass/fail as a word and an icon, not only a color
  function badge(pass) {
    const el = h("span", { class: `badge ${pass ? "badge-success" : "badge-danger"}` }, pass ? "Pass" : "Fail");
    el.insertAdjacentHTML("afterbegin", String(icon(pass ? "check" : "x")));
    return el;
  }

  /* ---------- Rendering ---------- */

  function render({ fg, bg, target }) {
    const bgColor = parseColor(bg);
    const fgColor = parseColor(fg);
    if (!bgColor || !fgColor) return;

    const bgRgb = flatten(bgColor);
    const fgRgb = flatten(fgColor, bgRgb);
    const ratio = contrast(fgRgb, bgRgb);

    // Inputs (do not overwrite the text field the user is typing in)
    $("#fg-picker").value = toHex(fgRgb);
    $("#bg-picker").value = toHex(bgRgb);
    if (document.activeElement !== $("#fg-text")) $("#fg-text").value = fg;
    if (document.activeElement !== $("#bg-text")) $("#bg-text").value = bg;
    $("#target").value = target;

    // Ratio and checks
    $("#ratio").textContent = formatRatio(ratio);
    const passed = CHECKS.filter((check) => ratio >= check.min).length;
    $("#verdict").textContent =
      ratio >= 7
        ? "Passes every level, including AAA."
        : ratio >= 4.5
          ? "Passes AA for all text. Good for body copy."
          : ratio >= 3
            ? "Only good enough for large text and UI parts. Too low for body text."
            : "Fails every level. Text in these colors is hard to read for many people.";
    $("#checks").replaceChildren(
      ...CHECKS.map((check) =>
        h(
          "li",
          { class: "check-row" },
          badge(ratio >= check.min),
          h("div", {}, h("strong", {}, `${check.name}, ${check.min}:1`), h("p", { class: "text-sm text-muted" }, check.text))
        )
      )
    );
    $("#checks").setAttribute("aria-label", `${passed} of ${CHECKS.length} checks pass`);

    // Live sample
    const sample = $("#sample");
    sample.style.backgroundColor = toHex(bgRgb);
    sample.style.color = toHex(fgRgb);
    sample.querySelector(".sample-button").style.cssText = `background-color: ${toHex(fgRgb)}; color: ${toHex(bgRgb)}`;
    sample.querySelector(".sample-input").style.borderColor = toHex(fgRgb);

    // Suggested fix
    const goal = Number(target);
    const box = $("#suggestion");
    if (ratio >= goal) {
      box.replaceChildren(h("p", { class: "flex items-center gap-xs text-success font-semibold" }, `Already passes ${goal}:1. Nothing to fix.`));
    } else {
      const fix = suggestFix(fgRgb, bgRgb, goal);
      if (!fix) {
        box.replaceChildren(h("p", { class: "text-danger" }, `No color with this hue reaches ${goal}:1 on this background. Change the background instead.`));
      } else {
        const hex = toHex(fix.color);
        box.replaceChildren(
          h(
            "div",
            { class: "flex items-center gap-s flex-wrap" },
            h("span", { class: "swatch-chip", style: { backgroundColor: hex } }),
            h(
              "div",
              { class: "grow" },
              h("strong", { class: "font-mono" }, hex),
              h("p", { class: "text-sm text-muted" }, `${fix.direction < 0 ? "Darker" : "Lighter"} text, ${formatRatio(contrast(fix.color, bgRgb))} on this background.`)
            ),
            h("button", { class: "btn btn-primary btn-sm", type: "button", onclick: () => store.set({ fg: hex }) }, "Use this color")
          )
        );
      }
    }
  }

  /* ---------- Token audit ---------- */

  const TOKEN_PAIRS = [
    ["--text", "--bg"],
    ["--text-muted", "--bg"],
    ["--link", "--bg"],
    ["--primary", "--bg"],
    ["--text", "--surface"],
    ["--text-muted", "--surface"],
    ["--link", "--surface"],
    ["--primary", "--surface"],
    ["--on-primary", "--primary"],
    // Not text: input borders and rating stars only need 3:1 (the UI column)
    ["--border-strong", "--bg"],
    ["--border-strong", "--surface"],
    ["--rating", "--bg"],
  ];

  const probe = $("#probe");
  const readToken = (name) => {
    probe.style.color = `var(${name})`;
    return parseColor(getComputedStyle(probe).color);
  };

  function renderTokens() {
    $("#theme-name").textContent = `${VWA.theme.get()} theme`;
    $("#tokens").replaceChildren(
      ...TOKEN_PAIRS.map(([fgName, bgName]) => {
        const bgRgb = flatten(readToken(bgName));
        const fgRgb = flatten(readToken(fgName), bgRgb);
        const ratio = contrast(fgRgb, bgRgb);
        const cell = (name, rgb) =>
          h("td", {}, h("span", { class: "flex items-center gap-xs" }, h("span", { class: "token-dot", style: { backgroundColor: toHex(rgb) } }), h("code", {}, name)));
        return h(
          "tr",
          {},
          cell(fgName, fgRgb),
          cell(bgName, bgRgb),
          h("td", { class: "num" }, formatRatio(ratio)),
          h("td", {}, badge(ratio >= 4.5)),
          h("td", {}, badge(ratio >= 3)),
          h("td", {}, h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: () => store.set({ fg: toHex(fgRgb), bg: toHex(bgRgb) }) }, "Check"))
        );
      })
    );
  }

  /* ---------- Events ---------- */

  for (const key of ["fg", "bg"]) {
    const text = $(`#${key}-text`);
    const error = $(`#${key}-error`);
    const showError = () => {
      const valid = Boolean(parseColor(text.value.trim()));
      error.textContent = valid ? "" : "Not a color. Try #1e293b, rgb(30 41 59), hsl(220 40% 20%) or navy.";
      text.setAttribute("aria-invalid", String(!valid));
    };

    on(text, "input", debounce(() => {
      const value = text.value.trim();
      if (parseColor(value)) {
        error.textContent = "";
        text.setAttribute("aria-invalid", "false");
        store.set({ [key]: value });
      }
    }, 150));
    on(text, "change", showError);
    on($(`#${key}-picker`), "input", (event) => store.set({ [key]: event.target.value }));
  }

  on("#swap", "click", () => store.set(({ fg, bg }) => ({ fg: bg, bg: fg })));
  on("#target", "change", (event) => store.set({ target: event.target.value }));

  store.subscribe(render);
  renderTokens();

  // Re-read the tokens when the theme changes (button in the navbar or the operating system)
  new MutationObserver(renderTokens).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-preset", "style"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", renderTokens);
})();

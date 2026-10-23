/* Theme builder: turns a few choices into arsenal token overrides, with a live preview. */
(function () {
  "use strict";

  const { $, $$, on, h, icon, createStore } = VWA;

  /* ---------- Token values (the same values as arsenal/css/tokens.css) ---------- */

  const HEADING_FONTS = {
    space: '"Space Grotesk", var(--font-sans)',
    system: "var(--font-sans)",
    serif: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
    rounded: 'ui-rounded, "SF Pro Rounded", var(--font-sans)',
    mono: "var(--font-mono)",
  };

  const BODY_FONTS = {
    system: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
    rounded: 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif',
    mono: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace',
  };

  const RADII = {
    sharp: { "--radius-s": "2px", "--radius-m": "3px", "--radius-l": "4px" },
    default: { "--radius-s": "4px", "--radius-m": "8px", "--radius-l": "16px" },
    soft: { "--radius-s": "6px", "--radius-m": "12px", "--radius-l": "20px" },
    round: { "--radius-s": "8px", "--radius-m": "14px", "--radius-l": "24px" },
  };

  const DENSITY = { compact: 0.85, default: 1, comfortable: 1.2 };

  // The spacing scale from tokens.css, in rem
  const SPACE = { "2xs": 0.25, xs: 0.5, s: 0.75, m: 1, l: 1.5, xl: 2, "2xl": 3, "3xl": 4, "4xl": 6 };

  const DEFAULTS = { brand: "#0f766e", accent: "#7c3aed", radius: "default", heading: "space", body: "system", size: 16, density: "default", shadow: 1 };

  /* The presets in tokens.css. "attribute" is the value for <html data-preset="...">;
     the default theme needs no attribute. A preset is identified by these four settings. */
  const IDENTITY = ["brand", "accent", "radius", "heading"];
  const PRESETS = {
    Default: { attribute: "", brand: "#0f766e", accent: "#7c3aed", radius: "default", heading: "space" },
    Indigo: { attribute: "indigo", brand: "#4f46e5", accent: "#db2777", radius: "default", heading: "system" },
    Forest: { attribute: "forest", brand: "#15803d", accent: "#b45309", radius: "soft", heading: "rounded" },
    Editorial: { attribute: "editorial", brand: "#1c1917", accent: "#b91c1c", radius: "sharp", heading: "serif" },
    Candy: { attribute: "candy", brand: "#6d28d9", accent: "#be185d", radius: "round", heading: "rounded" },
  };

  /* The editorial brand is nearly black, so in the dark theme its buttons and links turn
     light. These tokens come with that preset. */
  const EDITORIAL_EXTRAS = {
    "--primary": "light-dark(#1c1917, #f5f5f4)",
    "--on-primary": "light-dark(#ffffff, #1c1917)",
    "--link": "light-dark(#1c1917, #e7e5e4)",
    "--focus": "light-dark(#1c1917, #e7e5e4)",
  };

  const fmt = (n) => String(Number(n.toFixed(4)));

  // Shadow strength scales both the light and the dark alpha (dark shadows must be stronger to show)
  const shadows = (k) => {
    const a = (alpha) => fmt(Math.min(1, alpha * k));
    const color = (light, dark) => `light-dark(rgb(0 0 0 / ${a(light)}), rgb(0 0 0 / ${a(dark)}))`;
    return {
      "--shadow-s": `0 1px 2px ${color(0.08, 0.5)}`,
      "--shadow-m": `0 4px 12px ${color(0.1, 0.5)}, 0 1px 3px ${color(0.08, 0.4)}`,
      "--shadow-l": `0 12px 32px ${color(0.14, 0.6)}, 0 2px 6px ${color(0.08, 0.4)}`,
    };
  };

  /** The preset whose identity settings match the state, or null. */
  const matchingPreset = (state) =>
    Object.entries(PRESETS).find(([, preset]) => IDENTITY.every((key) => String(preset[key]).toLowerCase() === String(state[key]).toLowerCase())) || null;

  const isEditorial = (state) => matchingPreset(state)?.[0] === "Editorial";

  /** Every token the builder controls, as { "--name": value }. */
  function tokensFor(state) {
    const spacing = Object.fromEntries(
      Object.entries(SPACE).map(([name, rem]) => [`--space-${name}`, `${fmt(rem * DENSITY[state.density])}rem`])
    );
    return {
      "--brand": state.brand,
      "--accent": state.accent,
      ...RADII[state.radius],
      "--font-heading": HEADING_FONTS[state.heading],
      "--font-sans": BODY_FONTS[state.body],
      "--text-base": `${fmt(state.size / 16)}rem`,
      ...spacing,
      ...shadows(state.shadow),
    };
  }

  /* What to paste: the preset attribute when the four identity settings match a preset,
     plus a :root block with whatever still differs from that preset (or from the defaults). */
  function output(state) {
    const match = matchingPreset(state);
    const base = match ? { ...DEFAULTS, ...match[1] } : DEFAULTS;
    const current = tokensFor(state);
    const reference = tokensFor(base);
    const changed = Object.entries(current).filter(([name, value]) => value !== reference[name]);

    const parts = [];
    if (match && match[1].attribute) {
      parts.push(`<!-- index.html: the ${match[0]} preset from tokens.css -->\n<html lang="en" data-preset="${match[1].attribute}">`);
    }
    if (changed.length) {
      parts.push(`/* css/style.css (made with tools/theme.html) */\n:root {\n${changed.map(([name, value]) => `  ${name}: ${value};`).join("\n")}\n}`);
    }
    if (!parts.length) return "/* Same as the defaults in arsenal/css/tokens.css. Change a setting to see the code. */";
    return parts.join("\n\n");
  }

  /* ---------- Color math (same formula as tools/contrast.js) ---------- */

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  function parseColor(value) {
    if (!value || !CSS.supports("color", value)) return null;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
  }

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

  // The dark theme link color is color-mix(in oklab, brand, white 45%), or light gray for
  // the editorial preset. The canvas does the mixing.
  const darkLink = (state) =>
    isEditorial(state) ? parseColor("#e7e5e4") : parseColor(`color-mix(in oklab, ${state.brand}, white 45%)`);

  const toHex = (rgb) => `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;

  const formatRatio = (ratio) => {
    let text = ratio.toFixed(2);
    if (ratio < 4.5 && Number(text) >= 4.5) text = (Math.floor(ratio * 1000) / 1000).toFixed(3);
    return `${text}:1`;
  };

  /* ---------- State ---------- */

  const store = createStore(
    { ...DEFAULTS, scheme: VWA.theme.get() },
    { persist: "vwa-theme-builder-2" }
  );

  // Preset buttons with two color dots. data-theme-preset, not data-preset: tokens.css
  // themes any element that has data-preset, and these buttons should keep the page look.
  $("#presets").append(
    ...Object.entries(PRESETS).map(([name, preset]) =>
      h(
        "button",
        { class: "btn btn-outline btn-sm preset-button", type: "button", "data-theme-preset": name, "aria-pressed": "false" },
        h("span", { class: "preset-dots", "aria-hidden": "true" }, h("span", { style: { backgroundColor: preset.brand } }), h("span", { style: { backgroundColor: preset.accent } })),
        name
      )
    )
  );

  /* ---------- Rendering ---------- */

  function render(state) {
    // Controls
    for (const key of ["brand", "accent"]) {
      const rgb = parseColor(state[key]);
      if (rgb) $(`#${key}-picker`).value = toHex(rgb);
      const text = $(`#${key}-text`);
      if (document.activeElement !== text) {
        text.value = state[key];
        text.setAttribute("aria-invalid", "false");
      }
    }
    for (const name of ["radius", "density", "scheme"]) {
      $$(`input[name="${name}"]`).forEach((radio) => {
        radio.checked = radio.value === state[name];
      });
    }
    $("#heading-font").value = state.heading;
    $("#body-font").value = state.body;
    $("#size").value = String(state.size);
    $("#shadow").value = state.shadow;
    $("#shadow-label").textContent = `${Math.round(state.shadow * 100)}%`;

    const match = matchingPreset(state);
    $$("[data-theme-preset]").forEach((button) => {
      button.setAttribute("aria-pressed", String(match?.[0] === button.dataset.themePreset));
    });

    // Preview
    const preview = $("#preview");
    for (const [name, value] of Object.entries(tokensFor(state))) preview.style.setProperty(name, value);
    for (const [name, value] of Object.entries(EDITORIAL_EXTRAS)) {
      if (isEditorial(state)) preview.style.setProperty(name, value);
      else preview.style.removeProperty(name);
    }
    preview.style.colorScheme = state.scheme;

    // Contrast checks
    const brand = parseColor(state.brand);
    const accent = parseColor(state.accent);
    const white = [255, 255, 255];
    const checks = [
      ["White text on the brand color", "Primary buttons", contrast(white, brand), "Pick a darker brand color."],
      ["White text on the accent color", "The end of the gradient button", contrast(white, accent), "Pick a darker accent color."],
      ["Links on the light background", "Brand color on white", contrast(brand, white), "Pick a darker brand color."],
      ["Links on the dark background", "Lighter brand on #0f1115", contrast(darkLink(state), [15, 17, 21]), "Pick a brighter or more saturated brand color."],
    ];
    $("#checks").replaceChildren(
      ...checks.map(([title, detail, ratio, advice]) => {
        const pass = ratio >= 4.5;
        const badge = h("span", { class: `badge ${pass ? "badge-success" : "badge-danger"}` }, pass ? "Pass" : "Fail");
        badge.insertAdjacentHTML("afterbegin", String(icon(pass ? "check" : "alert-triangle")));
        return h(
          "li",
          { class: "warning-row" },
          badge,
          h(
            "div",
            {},
            h("strong", {}, `${title}: ${formatRatio(ratio)}`),
            h("p", { class: "text-sm text-muted" }, pass ? detail : `${detail}. ${advice}`)
          )
        );
      })
    );

    $("#theme-code").textContent = output(state);
  }

  store.subscribe(render);

  /* ---------- Events ---------- */

  for (const key of ["brand", "accent"]) {
    on(`#${key}-picker`, "input", (event) => store.set({ [key]: event.target.value }));
    on(`#${key}-text`, "input", (event) => {
      const value = event.target.value.trim();
      const valid = Boolean(parseColor(value));
      event.target.setAttribute("aria-invalid", String(!valid));
      if (valid) store.set({ [key]: value });
    });
  }

  on(document, "change", 'input[type="radio"]', (event, radio) => store.set({ [radio.name]: radio.value }));
  on("#heading-font", "change", (event) => store.set({ heading: event.target.value }));
  on("#body-font", "change", (event) => store.set({ body: event.target.value }));
  on("#size", "change", (event) => store.set({ size: Number(event.target.value) }));
  on("#shadow", "input", (event) => store.set({ shadow: Number(event.target.value) }));
  on("#presets", "click", "[data-theme-preset]", (event, button) => {
    const { attribute, ...settings } = PRESETS[button.dataset.themePreset];
    store.set({ ...DEFAULTS, ...settings });
  });
  on("#reset", "click", () => store.set({ ...DEFAULTS }));

  // Put a valid color back in the text field when the user leaves it with a typo
  on(document, "focusout", ".color-row .input", () => render(store.get()));
})();

/* Page builder: assembles sections from sections.js into a full HTML page. */
(function () {
  "use strict";

  const { $, on, h, icon, createStore, debounce, toast } = VWA;
  const sections = window.VWA_SECTIONS;
  const byId = Object.fromEntries(sections.map((section) => [section.id, section]));

  const PRESETS = {
    landing: ["navbar", "hero-centered", "logos", "features", "feature-split", "steps", "stats", "testimonials", "pricing", "faq", "cta", "contact", "footer"],
    launch: ["navbar", "hero-split", "stats", "features", "testimonials", "newsletter", "footer"],
    minimal: ["navbar", "hero-centered", "features", "footer"],
    contact: ["navbar", "hero-split", "team", "faq", "contact", "footer"],
  };

  // Brand and accent of each theme preset in arsenal/css/tokens.css ("" is the default theme)
  const THEMES = {
    "": { brand: "#0f766e", accent: "#7c3aed" },
    indigo: { brand: "#4f46e5", accent: "#db2777" },
    forest: { brand: "#15803d", accent: "#b45309" },
    editorial: { brand: "#1c1917", accent: "#b91c1c" },
    candy: { brand: "#6d28d9", accent: "#be185d" },
  };

  const store = createStore(
    { title: "Nimbus | Project boards for student teams", theme: "", ...THEMES[""], prefix: "../arsenal/", order: PRESETS.landing },
    { persist: "vwa-page-builder-v2" }
  );

  /* ---------- Building the page ---------- */

  const indent = (html, spaces) =>
    html
      .trim()
      .split("\n")
      .map((line) => (line ? " ".repeat(spaces) + line : line))
      .join("\n");

  function buildPage({ title, theme, brand, accent, prefix, order }) {
    const picked = order.map((id) => byId[id]).filter(Boolean);
    const region = (name) => picked.filter((section) => (section.region || "main") === name);
    const block = (list, spaces) => list.map((section) => indent(section.html, spaces)).join("\n\n");
    // Only write colors into the page when they differ from the chosen theme preset
    const preset = THEMES[theme] || THEMES[""];
    const presetAttribute = theme ? ` data-preset="${theme}"` : "";
    const colors =
      brand !== preset.brand || accent !== preset.accent
        ? `\n  <style>\n    :root {\n      --brand: ${brand};\n      --accent: ${accent};\n    }\n  </style>`
        : "";
    const usesPlaceholders = picked.some((section) => section.html.includes("data-placeholder"));
    const escapedTitle = VWA.escapeHTML(title);

    return `<!doctype html>
<html lang="en"${presetAttribute}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapedTitle}</title>
  <meta name="description" content="${escapedTitle}">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23${brand.slice(1)}'/%3E%3C/svg%3E">
  <script>document.documentElement.dataset.theme = localStorage.getItem("vwa-theme") || "";</script>
  <link rel="stylesheet" href="${prefix}css/arsenal.css">${colors}
  <script defer src="${prefix}js/dom.js"></script>
  <script defer src="${prefix}js/utils.js"></script>
  <script defer src="${prefix}js/icons.js"></script>${usesPlaceholders ? `\n  <script defer src="${prefix}js/sample-data.js"></script>` : ""}
  <script defer src="${prefix}js/ui.js"></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>

${block(region("header"), 2)}

  <main id="main">
${block(region("main"), 4)}
  </main>

${block(region("footer"), 2)}
</body>
</html>
`;
  }

  /* ---------- Rendering the controls ---------- */

  const picker = $("#picker");
  const groups = [...new Set(sections.map((section) => section.group))];
  for (const group of groups) {
    picker.append(
      h("p", { class: "sidenav-title m-0 p-0" }, group),
      ...sections
        .filter((section) => section.group === group)
        .map((section) =>
          h(
            "div",
            { class: "flex items-center gap-2xs" },
            h("label", { class: "grow" }, h("input", { type: "checkbox", value: section.id, "data-section": "" }), section.name),
            h("button", { class: "btn btn-ghost btn-icon btn-sm", type: "button", "data-copy-section": section.id, "aria-label": `Copy the ${section.name} HTML`, "data-tooltip": "Copy HTML" })
          )
        )
    );
  }

  picker.querySelectorAll("[data-copy-section]").forEach((button) => {
    button.innerHTML = String(icon("copy"));
  });

  function renderControls(state) {
    $("#page-title").value = state.title;
    $("#theme").value = state.theme;
    $("#brand").value = state.brand;
    $("#accent").value = state.accent;
    $("#prefix").value = state.prefix;

    picker.querySelectorAll("[data-section]").forEach((box) => {
      box.checked = state.order.includes(box.value);
    });

    $("#order").replaceChildren(
      ...state.order.map((id, index) =>
        h(
          "li",
          {},
          h("span", { class: "truncate" }, byId[id]?.name || id),
          h("button", { class: "btn btn-ghost btn-icon btn-sm", type: "button", "aria-label": "Move up", "data-move": `${index}:-1`, disabled: index === 0 }),
          h("button", { class: "btn btn-ghost btn-icon btn-sm", type: "button", "aria-label": "Move down", "data-move": `${index}:1`, disabled: index === state.order.length - 1 }),
          h("button", { class: "btn btn-ghost btn-icon btn-sm", type: "button", "aria-label": "Remove", "data-remove": index })
        )
      )
    );
    $("#order").querySelectorAll("[data-move]").forEach((button) => {
      button.innerHTML = String(icon(button.dataset.move.endsWith("-1") ? "chevron-up" : "chevron-down"));
    });
    $("#order").querySelectorAll("[data-remove]").forEach((button) => {
      button.innerHTML = String(icon("x"));
    });

    $("#summary").textContent = `${state.order.length} sections`;
  }

  const renderPreview = debounce((state) => {
    $("#preview").srcdoc = buildPage(state);
  }, 250);

  store.subscribe((state) => {
    renderControls(state);
    renderPreview(state);
  });

  /* ---------- Events ---------- */

  on("#page-title", "input", (event) => store.set({ title: event.target.value }));
  // Picking a theme preset also moves the color pickers to that preset's colors
  on("#theme", "change", (event) => store.set({ theme: event.target.value, ...THEMES[event.target.value] }));
  on("#brand", "input", (event) => store.set({ brand: event.target.value }));
  on("#accent", "input", (event) => store.set({ accent: event.target.value }));
  on("#prefix", "change", (event) => store.set({ prefix: event.target.value }));

  on("#preset", "change", (event) => {
    if (PRESETS[event.target.value]) store.set({ order: PRESETS[event.target.value] });
    event.target.value = "";
  });

  on(picker, "change", "[data-section]", (event, box) => {
    store.set((state) => {
      if (!box.checked) return { order: state.order.filter((id) => id !== box.value) };
      // Keep the header first and the footer last when adding sections
      const section = byId[box.value];
      const order = [...state.order];
      if (section.region === "header") order.unshift(box.value);
      else if (section.region === "footer") order.push(box.value);
      else {
        const footerIndex = order.findIndex((id) => byId[id]?.region === "footer");
        order.splice(footerIndex === -1 ? order.length : footerIndex, 0, box.value);
      }
      return { order };
    });
  });

  on("#order", "click", "[data-move]", (event, button) => {
    const [index, step] = button.dataset.move.split(":").map(Number);
    store.set((state) => {
      const order = [...state.order];
      [order[index], order[index + step]] = [order[index + step], order[index]];
      return { order };
    });
  });

  on("#order", "click", "[data-remove]", (event, button) => {
    const index = Number(button.dataset.remove);
    store.set((state) => ({ order: state.order.filter((_, i) => i !== index) }));
  });

  // Preview width: a radio group, so arrow keys work without extra code
  on("#preview-width", "change", (event) => {
    $("#preview").style.setProperty("--frame-width", event.target.value);
  });

  // Copy one section, to paste into a page you already have
  on(picker, "click", "[data-copy-section]", async (event, button) => {
    const section = byId[button.dataset.copySection];
    await navigator.clipboard.writeText(`${section.html.trim()}\n`);
    toast(`${section.name} copied`, { type: "success", duration: 2000 });
  });

  on("#copy", "click", async () => {
    await navigator.clipboard.writeText(buildPage(store.get()));
    toast("Page HTML copied", { type: "success" });
  });

  on("#download", "click", () => {
    const blob = new Blob([buildPage(store.get())], { type: "text/html" });
    const link = h("a", { href: URL.createObjectURL(blob), download: "index.html" });
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    toast("index.html downloaded. Save it in a folder next to arsenal/.", { type: "success", duration: 6000 });
  });
})();

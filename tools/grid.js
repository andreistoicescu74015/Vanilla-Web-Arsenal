/* Grid playground: the controls write to a store, and every change re-renders the
   preview, the track overlay with line numbers, and the generated code. */
(function () {
  "use strict";

  const { $, $$, on, h, createStore, escapeHTML } = VWA;

  const DEFAULT_CONTAINER = {
    columns: "repeat(3, 1fr)",
    rows: "",
    autoRows: "",
    areas: "",
    rowGap: 12,
    columnGap: 12,
    justifyItems: "normal",
    alignItems: "normal",
    justifyContent: "normal",
    alignContent: "normal",
    autoFlow: "row",
    height: "auto",
  };

  const DEFAULT_ITEM = { label: "Item", column: "", row: "", area: "", justifySelf: "auto", alignSelf: "auto" };

  const item = (overrides) => ({ ...DEFAULT_ITEM, ...overrides });
  const repeat = (count, overrides) => Array.from({ length: count }, () => item(overrides));

  const PRESETS = {
    reset: { container: {}, items: repeat(6, {}) },
    twelve: {
      container: { columns: "repeat(12, 1fr)", autoRows: "minmax(4rem, auto)" },
      items: [
        item({ label: "Header", column: "span 12" }),
        item({ label: "Main", column: "span 8" }),
        item({ label: "Aside", column: "span 4" }),
        ...repeat(3, { label: "Card", column: "span 4" }),
      ],
    },
    holyGrail: {
      container: {
        columns: "12rem 1fr",
        rows: "auto 1fr auto",
        areas: '"header header"\n"sidebar main"\n"footer footer"',
        height: "360px",
      },
      items: [
        item({ label: "Header", area: "header" }),
        item({ label: "Sidebar", area: "sidebar" }),
        item({ label: "Main", area: "main" }),
        item({ label: "Footer", area: "footer" }),
      ],
    },
    gallery: {
      container: { columns: "repeat(auto-fit, minmax(7rem, 1fr))", autoRows: "7rem", autoFlow: "row dense", rowGap: 8, columnGap: 8 },
      items: [
        item({ label: "Wide and tall", column: "span 2", row: "span 2" }),
        ...repeat(3, { label: "Photo" }),
        item({ label: "Wide", column: "span 2" }),
        ...repeat(5, { label: "Photo" }),
      ],
    },
    dashboard: {
      container: { columns: "10rem 1fr", rows: "auto 1fr", areas: '"sidebar header"\n"sidebar main"', height: "360px" },
      items: [item({ label: "Sidebar", area: "sidebar" }), item({ label: "Header", area: "header" }), item({ label: "Main", area: "main" })],
    },
    featured: {
      container: { columns: "repeat(3, 1fr)", autoRows: "minmax(6rem, auto)", rowGap: 16, columnGap: 16 },
      items: [item({ label: "Featured", column: "span 2" }), ...repeat(6, { label: "Card" })],
    },
  };

  const store = createStore(
    { container: DEFAULT_CONTAINER, items: PRESETS.reset.items, selected: 0 },
    { persist: "vwa-grid-playground" }
  );

  // Saved state from an older version may miss fields; fill them from the defaults
  const normalize = (state) => {
    const items = (state.items?.length ? state.items : PRESETS.reset.items).map((it) => ({ ...DEFAULT_ITEM, ...it }));
    return {
      container: { ...DEFAULT_CONTAINER, ...state.container },
      items,
      selected: VWA.clamp(state.selected || 0, 0, items.length - 1),
    };
  };

  const valid = (property, value) => value === "" || CSS.supports(property, value);

  // The textarea holds one quoted row per line; CSS wants them separated by spaces
  const areaLines = (areas) =>
    areas
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const checkValue = (property, value) => (property === "grid-template-areas" ? areaLines(value).join(" ") : value.trim());

  /* ---------- Generated code ---------- */

  function containerDeclarations(c) {
    const lines = ["display: grid;"];
    if (valid("grid-template-columns", c.columns)) lines.push(`grid-template-columns: ${c.columns};`);
    if (c.rows && valid("grid-template-rows", c.rows)) lines.push(`grid-template-rows: ${c.rows};`);
    const areas = areaLines(c.areas);
    if (areas.length && valid("grid-template-areas", areas.join(" "))) {
      lines.push(`grid-template-areas:\n${areas.map((line) => `    ${line}`).join("\n")};`);
    }
    if (c.autoRows && valid("grid-auto-rows", c.autoRows)) lines.push(`grid-auto-rows: ${c.autoRows};`);
    if (c.autoFlow !== "row") lines.push(`grid-auto-flow: ${c.autoFlow};`);
    if (c.rowGap || c.columnGap) {
      lines.push(c.rowGap === c.columnGap ? `gap: ${c.rowGap}px;` : `gap: ${c.rowGap}px ${c.columnGap}px; /* row column */`);
    }
    if (c.justifyItems !== "normal") lines.push(`justify-items: ${c.justifyItems};`);
    if (c.alignItems !== "normal") lines.push(`align-items: ${c.alignItems};`);
    if (c.justifyContent !== "normal") lines.push(`justify-content: ${c.justifyContent};`);
    if (c.alignContent !== "normal") lines.push(`align-content: ${c.alignContent};`);
    if (c.height !== "auto") lines.push(`height: ${c.height};`);
    return lines;
  }

  function itemDeclarations(it) {
    const lines = [];
    if (it.area && valid("grid-area", it.area)) {
      lines.push(`grid-area: ${it.area};`);
    } else {
      if (it.column && valid("grid-column", it.column)) lines.push(`grid-column: ${it.column};`);
      if (it.row && valid("grid-row", it.row)) lines.push(`grid-row: ${it.row};`);
    }
    if (it.justifySelf !== "auto") lines.push(`justify-self: ${it.justifySelf};`);
    if (it.alignSelf !== "auto") lines.push(`align-self: ${it.alignSelf};`);
    return lines;
  }

  const rule = (selector, lines) => `${selector} {\n${lines.map((line) => `  ${line}`).join("\n")}\n}`;

  function buildCSS({ container, items }) {
    const rules = [rule(".layout", containerDeclarations(container))];
    items.forEach((it, i) => {
      const lines = itemDeclarations(it);
      if (lines.length) rules.push(rule(`.item-${i + 1}`, lines));
    });
    return rules.join("\n\n");
  }

  function buildHTML({ items }) {
    const children = items.map((it, i) => `  <div class="item-${i + 1}">${escapeHTML(it.label)}</div>`);
    return `<div class="layout">\n${children.join("\n")}\n</div>`;
  }

  /* ---------- Rendering ---------- */

  function renderPreview({ container: c, items, selected }) {
    const preview = $("#preview");
    const focusedIndex = document.activeElement?.closest?.(".grid-item")?.dataset.index;
    const areas = areaLines(c.areas).join(" ");

    Object.assign(preview.style, {
      display: "grid",
      gridTemplateColumns: valid("grid-template-columns", c.columns) ? c.columns : "",
      gridTemplateRows: valid("grid-template-rows", c.rows) ? c.rows : "",
      gridTemplateAreas: areas && valid("grid-template-areas", areas) ? areas : "",
      gridAutoRows: valid("grid-auto-rows", c.autoRows) ? c.autoRows : "",
      gridAutoFlow: c.autoFlow,
      rowGap: `${c.rowGap}px`,
      columnGap: `${c.columnGap}px`,
      justifyItems: c.justifyItems,
      alignItems: c.alignItems,
      justifyContent: c.justifyContent,
      alignContent: c.alignContent,
      height: c.height === "auto" ? "" : c.height,
    });

    preview.replaceChildren(
      h("div", { class: "grid-overlay", "aria-hidden": "true" }),
      ...items.map((it, i) => {
        const hue = (i * 47 + 230) % 360;
        const button = h(
          "button",
          {
            class: "grid-item",
            type: "button",
            "data-index": i,
            "aria-pressed": String(i === selected),
            "aria-label": `Item ${i + 1}: ${it.label}`,
          },
          h("span", { class: "grid-item-number" }, i + 1),
          h("span", {}, it.label)
        );
        // grid-area overrides grid-column and grid-row, so only one of the two is set
        if (it.area && valid("grid-area", it.area)) {
          button.style.gridArea = it.area;
        } else {
          if (valid("grid-column", it.column)) button.style.gridColumn = it.column;
          if (valid("grid-row", it.row)) button.style.gridRow = it.row;
        }
        button.style.justifySelf = it.justifySelf;
        button.style.alignSelf = it.alignSelf;
        button.style.setProperty("--item-bg", `light-dark(hsl(${hue} 85% 92%), hsl(${hue} 40% 24%))`);
        button.style.setProperty("--item-border", `hsl(${hue} 65% 55%)`);
        return button;
      })
    );

    drawOverlay();
    if (focusedIndex !== undefined) preview.querySelector(`[data-index="${focusedIndex}"]`)?.focus();
  }

  // The browser reports the final size of every track (explicit and implicit) in px.
  // A second grid with exactly those tracks, drawn behind the items, shows the cells and lines.
  function drawOverlay() {
    const preview = $("#preview");
    const overlay = preview.querySelector(".grid-overlay");
    if (!overlay) return;
    const style = getComputedStyle(preview);
    const tracks = (value) => (value === "none" ? [] : value.replace(/\[[^\]]*\]/g, " ").trim().split(/\s+/).filter(Boolean));
    const columns = tracks(style.gridTemplateColumns);
    const rows = tracks(style.gridTemplateRows);

    Object.assign(overlay.style, {
      gridTemplateColumns: columns.join(" "),
      gridTemplateRows: rows.join(" "),
      columnGap: style.columnGap,
      rowGap: style.rowGap,
      justifyContent: style.justifyContent,
      alignContent: style.alignContent,
    });

    const label = (className, number) => h("span", { class: `line-number ${className}` }, number);
    const cells = [];
    rows.forEach((_, r) => {
      columns.forEach((_, c) => {
        const cell = h("div", {});
        if (r === 0) cell.append(label("col start", c + 1));
        if (r === 0 && c === columns.length - 1) cell.append(label("col end", c + 2));
        if (c === 0) cell.append(label("row start", r + 1));
        if (c === 0 && r === rows.length - 1) cell.append(label("row end", r + 2));
        cells.push(cell);
      });
    });
    overlay.replaceChildren(...cells);
  }

  new ResizeObserver(() => drawOverlay()).observe($("#preview"));

  // Only touch a control when its value differs, so typing is never interrupted
  const setValue = (el, value) => {
    if (el.value !== String(value)) el.value = value;
  };

  const markValidity = (el) => {
    if (el.dataset.check) el.setAttribute("aria-invalid", String(!valid(el.dataset.check, checkValue(el.dataset.check, el.value))));
  };

  function renderControls({ container, items, selected }) {
    $$("[data-container]").forEach((el) => {
      setValue(el, container[el.dataset.container]);
      markValidity(el);
    });
    setValue($("#g-count"), items.length);

    const it = items[selected];
    $$("[data-item]").forEach((el) => {
      setValue(el, it[el.dataset.item]);
      markValidity(el);
    });
    $("#item-heading").textContent = `Item ${selected + 1} of ${items.length}`;
  }

  function renderCode(state) {
    const highlight = window.DOCS || { highlightCSS: escapeHTML, highlightHTML: escapeHTML };
    $("#css-output").innerHTML = highlight.highlightCSS(buildCSS(state));
    $("#html-output").innerHTML = highlight.highlightHTML(buildHTML(state));
  }

  store.subscribe((raw) => {
    const state = normalize(raw);
    renderControls(state);
    renderPreview(state);
    renderCode(state);
  });

  /* ---------- Events ---------- */

  on("#controls", "input", "[data-container]", (event, el) => {
    const key = el.dataset.container;
    let value = el.value;
    if (el.type === "number") {
      if (value === "" || Number.isNaN(Number(value))) return;
      value = Math.max(0, Number(value));
    }
    store.set((raw) => ({ container: { ...normalize(raw).container, [key]: value } }));
  });

  on("#controls", "input", "[data-item]", (event, el) => {
    store.set((raw) => {
      const state = normalize(raw);
      return { items: state.items.map((it, i) => (i === state.selected ? { ...it, [el.dataset.item]: el.value } : it)) };
    });
  });

  // "change", not "input": typing 12 would otherwise pass through 1 and drop eleven items
  on("#g-count", "change", (event) => {
    const count = Number(event.target.value);
    if (!Number.isInteger(count) || count < 1 || count > 24) return;
    store.set((raw) => {
      const state = normalize(raw);
      const items = state.items.slice(0, count);
      while (items.length < count) items.push(item({}));
      return { items, selected: Math.min(state.selected, count - 1) };
    });
  });

  // Quick picks fill their input and fire an input event, so the normal handler applies them
  on("#controls", "click", ".quick-picks button", (event, button) => {
    const input = $(button.closest("[data-fill]").dataset.fill);
    input.value = button.textContent;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  on("#preview", "click", ".grid-item", (event, button) => {
    store.set({ selected: Number(button.dataset.index) });
  });

  on(document, "click", "[data-preset]", (event, button) => {
    const preset = PRESETS[button.dataset.preset];
    store.set({
      container: { ...DEFAULT_CONTAINER, ...preset.container },
      items: preset.items.map((it) => ({ ...it })),
      selected: 0,
    });
  });
})();

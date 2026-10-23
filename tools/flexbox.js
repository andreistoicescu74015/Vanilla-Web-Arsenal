/* Flexbox playground: the controls write to a store, and every change re-renders the
   preview, the axis legend and the generated code. */
(function () {
  "use strict";

  const { $, $$, on, h, icon, createStore, escapeHTML } = VWA;

  const DEFAULT_CONTAINER = {
    display: "flex",
    direction: "row",
    wrap: "nowrap",
    justify: "flex-start",
    alignItems: "stretch",
    alignContent: "normal",
    rowGap: 12,
    columnGap: 12,
    width: 100,
    height: "240px",
  };

  const DEFAULT_ITEM = {
    label: "Item",
    text: "short",
    grow: 0,
    shrink: 1,
    basis: "auto",
    order: 0,
    alignSelf: "auto",
    margin: "",
    width: "",
    height: "",
  };

  const item = (overrides) => ({ ...DEFAULT_ITEM, ...overrides });
  const repeat = (count, overrides) => Array.from({ length: count }, () => item(overrides));

  const PRESETS = {
    reset: { container: {}, items: repeat(3, {}) },
    navbar: {
      container: { alignItems: "center", rowGap: 16, columnGap: 16, height: "auto" },
      items: [item({ label: "Logo", margin: "margin-right: auto" }), item({ label: "Home" }), item({ label: "About" }), item({ label: "Contact" })],
    },
    centered: {
      container: { justify: "center", alignItems: "center", height: "360px" },
      items: [item({ label: "Centered" })],
    },
    equal: {
      container: { rowGap: 16, columnGap: 16, height: "160px" },
      items: repeat(3, { label: "Column", grow: 1, basis: "0" }),
    },
    sidebar: {
      container: { rowGap: 16, columnGap: 16 },
      items: [item({ label: "Sidebar", basis: "200px", shrink: 0 }), item({ label: "Content", grow: 1, basis: "0", text: "long" })],
    },
    footer: {
      container: { direction: "column", rowGap: 8, columnGap: 8, height: "360px" },
      items: [item({ label: "Header" }), item({ label: "Main", grow: 1 }), item({ label: "Footer" })],
    },
    cards: {
      container: { wrap: "wrap", rowGap: 16, columnGap: 16, height: "auto" },
      items: repeat(6, { label: "Card", grow: 1, basis: "180px", text: "medium" }),
    },
    media: {
      container: { alignItems: "flex-start", rowGap: 16, columnGap: 16, height: "auto" },
      items: [item({ label: "Image", width: "80px", height: "80px", shrink: 0 }), item({ label: "Text", grow: 1, basis: "0", text: "long" })],
    },
  };

  const TEXT = {
    short: "",
    medium: " with a few more words",
    long: " holds a much longer sentence, so its content asks for a lot more room than the others",
  };

  const store = createStore(
    { container: DEFAULT_CONTAINER, items: PRESETS.reset.items, selected: 0 },
    { persist: "vwa-flexbox-playground" }
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

  /* ---------- Generated code ---------- */

  function containerDeclarations(c) {
    const lines = [`display: ${c.display};`];
    if (c.direction !== "row") lines.push(`flex-direction: ${c.direction};`);
    if (c.wrap !== "nowrap") lines.push(`flex-wrap: ${c.wrap};`);
    if (c.justify !== "flex-start") lines.push(`justify-content: ${c.justify};`);
    if (c.alignItems !== "stretch") lines.push(`align-items: ${c.alignItems};`);
    if (c.alignContent !== "normal") lines.push(`align-content: ${c.alignContent};`);
    if (c.rowGap || c.columnGap) {
      lines.push(c.rowGap === c.columnGap ? `gap: ${c.rowGap}px;` : `gap: ${c.rowGap}px ${c.columnGap}px; /* row column */`);
    }
    if (c.width !== 100) lines.push(`width: ${c.width}%;`);
    if (c.height !== "auto") lines.push(`height: ${c.height};`);
    return lines;
  }

  function itemDeclarations(it) {
    const lines = [];
    // The flex shorthand sets grow, shrink and basis together, which the CSS-Tricks guide recommends
    if (it.grow !== 0 || it.shrink !== 1 || it.basis !== "auto") lines.push(`flex: ${it.grow} ${it.shrink} ${it.basis || "auto"};`);
    if (it.order !== 0) lines.push(`order: ${it.order};`);
    if (it.alignSelf !== "auto") lines.push(`align-self: ${it.alignSelf};`);
    if (it.margin) lines.push(`${it.margin};`);
    if (it.width && valid("width", it.width)) lines.push(`width: ${it.width};`);
    if (it.height && valid("height", it.height)) lines.push(`height: ${it.height};`);
    return lines;
  }

  const rule = (selector, lines) => `${selector} {\n${lines.map((line) => `  ${line}`).join("\n")}\n}`;
  const itemText = (it) => it.label + TEXT[it.text];

  function buildCSS({ container, items }) {
    const rules = [rule(".layout", containerDeclarations(container))];
    items.forEach((it, i) => {
      const lines = itemDeclarations(it);
      if (lines.length) rules.push(rule(`.item-${i + 1}`, lines));
    });
    return rules.join("\n\n");
  }

  function buildHTML({ items }) {
    const children = items.map((it, i) => `  <div class="item-${i + 1}">${escapeHTML(itemText(it))}</div>`);
    return `<div class="layout">\n${children.join("\n")}\n</div>`;
  }

  /* ---------- Rendering ---------- */

  const AXIS = {
    row: ["left to right", 0],
    "row-reverse": ["right to left", 180],
    column: ["top to bottom", 90],
    "column-reverse": ["bottom to top", -90],
  };

  function renderAxes(c) {
    const isRow = c.direction.startsWith("row");
    const [mainText, mainAngle] = AXIS[c.direction];
    // wrap-reverse flips the cross axis, so new lines stack the other way
    const reversed = c.wrap === "wrap-reverse";
    const [crossText, crossAngle] = isRow
      ? reversed ? AXIS["column-reverse"] : AXIS.column
      : reversed ? AXIS["row-reverse"] : AXIS.row;

    const badge = (className, angle, text) =>
      h("span", { class: `badge ${className}` }, h("span", { class: "axis-icon", style: { rotate: `${angle}deg` } }), text);

    $("#axes").replaceChildren(
      badge("badge-primary", mainAngle, `Main axis: ${mainText}`),
      badge("badge-warning", crossAngle, `Cross axis: ${crossText}`)
    );
    $$("#axes .axis-icon").forEach((el) => {
      el.innerHTML = String(icon("arrow-right"));
    });
  }

  function renderPreview({ container: c, items, selected }) {
    const preview = $("#preview");
    const focusedIndex = document.activeElement?.closest?.(".flex-item")?.dataset.index;

    Object.assign(preview.style, {
      display: c.display,
      flexDirection: c.direction,
      flexWrap: c.wrap,
      justifyContent: c.justify,
      alignItems: c.alignItems,
      alignContent: c.alignContent,
      rowGap: `${c.rowGap}px`,
      columnGap: `${c.columnGap}px`,
      width: c.display === "flex" ? `${c.width}%` : "",
      height: c.height === "auto" ? "" : c.height,
    });

    preview.replaceChildren(
      ...items.map((it, i) => {
        const hue = (i * 47 + 230) % 360;
        const button = h(
          "button",
          {
            class: "flex-item",
            type: "button",
            "data-index": i,
            "aria-pressed": String(i === selected),
            "aria-label": `Item ${i + 1}: ${itemText(it)}`,
            style: {
              order: it.order,
              flexGrow: it.grow,
              flexShrink: it.shrink,
              flexBasis: valid("flex-basis", it.basis) ? it.basis : "auto",
              alignSelf: it.alignSelf,
              width: valid("width", it.width) ? it.width : "",
              height: valid("height", it.height) ? it.height : "",
            },
          },
          h("span", { class: "flex-item-number" }, i + 1),
          h("span", {}, itemText(it))
        );
        button.style.setProperty("--item-bg", `light-dark(hsl(${hue} 85% 92%), hsl(${hue} 40% 24%))`);
        button.style.setProperty("--item-border", `hsl(${hue} 65% 55%)`);
        if (it.margin) {
          const [property, value] = it.margin.split(":").map((part) => part.trim());
          button.style.setProperty(property, value);
        }
        return button;
      })
    );

    if (focusedIndex !== undefined) preview.querySelector(`[data-index="${focusedIndex}"]`)?.focus();
  }

  // Only touch a control when its value differs, so typing is never interrupted
  const setValue = (el, value) => {
    if (el.value !== String(value)) el.value = value;
  };

  function renderControls({ container, items, selected }) {
    $$("[data-container]").forEach((el) => setValue(el, container[el.dataset.container]));
    $("#c-width-value").textContent = `${container.width}%`;
    $("#c-width").disabled = container.display !== "flex";

    const it = items[selected];
    $$("[data-item]").forEach((el) => {
      setValue(el, it[el.dataset.item]);
      if (el.dataset.check) el.setAttribute("aria-invalid", String(!valid(el.dataset.check, el.value.trim())));
    });
    $("#item-heading").textContent = `Item ${selected + 1} of ${items.length}`;
    $("#remove-item").disabled = items.length <= 1;
    $("#add-item").disabled = items.length >= 12;
  }

  function renderCode(state) {
    const css = buildCSS(state);
    const html = buildHTML(state);
    const highlight = window.DOCS || { highlightCSS: escapeHTML, highlightHTML: escapeHTML };
    $("#css-output").innerHTML = highlight.highlightCSS(css);
    $("#html-output").innerHTML = highlight.highlightHTML(html);
  }

  store.subscribe((raw) => {
    const state = normalize(raw);
    renderControls(state);
    renderAxes(state.container);
    renderPreview(state);
    renderCode(state);
  });

  /* ---------- Events ---------- */

  const updateItem = (changes) =>
    store.set((raw) => {
      const state = normalize(raw);
      const items = state.items.map((it, i) => (i === state.selected ? { ...it, ...changes } : it));
      return { items };
    });

  on("#controls", "input", "[data-container]", (event, el) => {
    const key = el.dataset.container;
    const value = el.type === "number" || el.type === "range" ? Number(el.value) : el.value;
    if (Number.isNaN(value)) return;
    store.set((raw) => ({ container: { ...normalize(raw).container, [key]: value } }));
  });

  on("#controls", "input", "[data-item]", (event, el) => {
    const key = el.dataset.item;
    if (el.type === "number") {
      if (el.value === "" || Number.isNaN(Number(el.value))) return;
      updateItem({ [key]: Math.max(key === "order" ? -99 : 0, Number(el.value)) });
    } else {
      updateItem({ [key]: el.dataset.check ? el.value.trim() : el.value });
    }
  });

  on("#preview", "click", ".flex-item", (event, button) => {
    store.set({ selected: Number(button.dataset.index) });
  });

  on("#add-item", "click", () => {
    store.set((raw) => {
      const state = normalize(raw);
      return { items: [...state.items, item({})], selected: state.items.length };
    });
  });

  on("#remove-item", "click", () => {
    store.set((raw) => {
      const state = normalize(raw);
      const items = state.items.filter((_, i) => i !== state.selected);
      return { items, selected: Math.min(state.selected, items.length - 1) };
    });
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

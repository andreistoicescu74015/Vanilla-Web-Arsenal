/* Fluid size generator: clamp() math for one value and for a whole type scale. */
(function () {
  "use strict";

  const { $, $$, on, h, createStore } = VWA;

  const RATIOS = [
    ["1.125", "1.125 major second"],
    ["1.2", "1.2 minor third"],
    ["1.25", "1.25 major third"],
    ["1.333", "1.333 perfect fourth"],
    ["1.5", "1.5 perfect fifth"],
    ["1.618", "1.618 golden ratio"],
  ];

  // Scale steps and the arsenal token each one replaces
  const STEPS = [
    [-1, "--text-sm"],
    [0, "--text-base"],
    [1, "--text-lg"],
    [2, "--text-xl"],
    [3, "--text-2xl"],
    [4, "--text-3xl"],
    [5, "--text-4xl"],
  ];

  /* ---------- Math ---------- */

  /** Rounds to 4 decimals and drops trailing zeros: 0.83333 -> "0.8333", 1.0 -> "1". */
  const fmt = (n) => String(Number(n.toFixed(4)) || 0);

  /**
   * A value that is minPx at minVw and maxPx at maxVw, linear in between.
   *   slope     = (maxPx - minPx) / (maxVw - minVw)   px gained per px of screen width
   *   intercept = minPx - slope * minVw               the size at a 0px wide screen
   *   1vw is 1% of the screen width, so the vw part is slope * 100.
   */
  function fluid(minPx, maxPx, minVw, maxVw, root) {
    const slope = (maxPx - minPx) / (maxVw - minVw);
    const interceptPx = minPx - slope * minVw;
    const lower = Math.min(minPx, maxPx);
    const upper = Math.max(minPx, maxPx);
    const vw = slope * 100;
    const intercept = interceptPx / root;

    let preferred;
    if (fmt(vw) === "0") preferred = `${fmt(intercept)}rem`;
    else if (fmt(intercept) === "0") preferred = `${fmt(vw)}vw`;
    else preferred = `${fmt(intercept)}rem ${vw < 0 ? "-" : "+"} ${fmt(Math.abs(vw))}vw`;

    return {
      css: `clamp(${fmt(lower / root)}rem, ${preferred}, ${fmt(upper / root)}rem)`,
      at: (width) => Math.min(upper, Math.max(lower, interceptPx + slope * width)),
      slope,
    };
  }

  /* ---------- State ---------- */

  const store = createStore(
    { unit: "px", min: 16, max: 24, minVw: 320, maxVw: 1280, root: 16, sim: 800, baseMin: 16, baseMax: 18, ratioMin: "1.2", ratioMax: "1.25" },
    { persist: "vwa-clamp" }
  );

  for (const select of [$("#ratio-min"), $("#ratio-max")]) {
    select.append(...RATIOS.map(([value, label]) => h("option", { value }, label)));
  }

  /* ---------- Rendering ---------- */

  // Writes a value into an input unless the user is typing in it (that would move the cursor)
  const setValue = (input, value) => {
    if (document.activeElement !== input) input.value = value;
  };

  const px = (n) => `${Number(n.toFixed(2))}px`;

  function render(state) {
    const { unit, min, max, minVw, maxVw, root, sim } = state;
    const toUnit = (value) => (unit === "rem" ? fmt(value / root) : fmt(value));

    $$('input[name="unit"]').forEach((radio) => {
      radio.checked = radio.value === unit;
    });
    setValue($("#min-size"), toUnit(min));
    setValue($("#max-size"), toUnit(max));
    setValue($("#min-vw"), minVw);
    setValue($("#max-vw"), maxVw);
    setValue($("#root"), root);
    setValue($("#base-min"), state.baseMin);
    setValue($("#base-max"), state.baseMax);
    $("#ratio-min").value = state.ratioMin;
    $("#ratio-max").value = state.ratioMax;
    $("#sim").value = sim;
    $("#sim-scale").value = sim;
    $("#window-width").textContent = `${document.documentElement.clientWidth}px`;

    const error = maxVw <= minVw ? "The second screen width must be larger than the first." : "";
    $("#value-error").textContent = error;
    if (error) return;

    // One value
    const value = fluid(min, max, minVw, maxVw, root);
    $("#clamp-code").textContent = value.css;
    $("#clamp-explain").textContent =
      `Below ${minVw}px wide: ${px(min)}. Above ${maxVw}px: ${px(max)}. ` +
      `In between it changes by ${px(Math.abs(value.slope) * 100)} for every 100px of screen width.`;
    $("#sim-label").textContent = `${sim}px`;
    $("#sim-result").textContent = `At ${sim}px wide the value is ${px(value.at(sim))}.`;
    $("#sim-preview").style.fontSize = `${value.at(sim)}px`;
    $("#real-preview").style.fontSize = value.css;

    // Type scale
    const ratioMin = Number(state.ratioMin);
    const ratioMax = Number(state.ratioMax);
    const scale = STEPS.map(([step, token]) => {
      const small = state.baseMin * ratioMin ** step;
      const large = state.baseMax * ratioMax ** step;
      return { step, token, small, large, value: fluid(small, large, minVw, maxVw, root) };
    });

    $("#scale-code").textContent = `:root {\n${scale.map((s) => `  ${s.token}: ${s.value.css};`).join("\n")}\n}`;
    $("#scale-width").textContent = `${sim}px wide`;
    $("#scale-preview").replaceChildren(
      ...scale.map((s) =>
        h(
          "div",
          { class: "scale-row" },
          h("div", {}, h("code", {}, s.token), h("p", { class: "text-xs text-muted mt-xs" }, `${px(s.small)} to ${px(s.large)}`)),
          h("p", { style: { fontSize: `${s.value.at(sim)}px`, fontWeight: s.step > 1 ? "700" : "400" } }, s.step > 1 ? "Ship the demo" : "The quick brown fox jumps over the lazy dog")
        )
      )
    );
  }

  store.subscribe(render);

  /* ---------- Events ---------- */

  const numberFrom = (input) => (input.value.trim() === "" ? NaN : Number(input.value));

  on("#value-form", "change", 'input[name="unit"]', (event, radio) => store.set({ unit: radio.value }));

  on("#value-form", "input", "input:not([type='radio'])", (event, input) => {
    const { unit, root } = store.get();
    const value = numberFrom(input);
    // Half-typed or empty values are not saved; the error stays until the field is fixed
    if (!Number.isFinite(value) || value < 0 || (input.id === "root" && value === 0)) {
      $("#value-error").textContent = "Fill in every field with a positive number.";
      return;
    }
    const sizeInPx = unit === "rem" ? value * root : value;
    const changes = {
      "min-size": { min: sizeInPx },
      "max-size": { max: sizeInPx },
      "min-vw": { minVw: value },
      "max-vw": { maxVw: value },
      root: { root: value },
    }[input.id];
    if (changes) store.set(changes);
  });

  on("#scale-form", "input", "input", (event, input) => {
    const value = numberFrom(input);
    if (!Number.isFinite(value) || value <= 0) return;
    store.set(input.id === "base-min" ? { baseMin: value } : { baseMax: value });
  });
  on("#scale-form", "change", "select", (event, select) => {
    store.set(select.id === "ratio-min" ? { ratioMin: select.value } : { ratioMax: select.value });
  });

  on("#sim", "input", (event) => store.set({ sim: Number(event.target.value) }));
  on("#sim-scale", "input", (event) => store.set({ sim: Number(event.target.value) }));
  on(window, "resize", VWA.debounce(() => render(store.get()), 150));

  // Leaving a field empty or invalid puts the last good value back
  on(document, "focusout", "input[type='number']", () => render(store.get()));
})();

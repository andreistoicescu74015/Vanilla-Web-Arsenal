/* Catalog page only: presets, icon gallery, charts and the interactive demos. */
(function () {
  "use strict";

  const { $, $$, on, h, icon, toast, formToObject } = VWA;
  const root = document.documentElement;

  /* ---------- Presets ---------- */
  /* The buttons use data-set-preset, not data-preset: tokens.css themes any element
     with data-preset, and the buttons should keep the page look. */

  const PRESET_KEY = "vwa-catalog-preset";

  function showPreset() {
    $$("[data-set-preset]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.setPreset === (root.dataset.preset || "")));
    });
  }

  on(document, "click", "[data-set-preset]", (event, button) => {
    root.dataset.preset = button.dataset.setPreset;
    try {
      localStorage.setItem(PRESET_KEY, button.dataset.setPreset);
    } catch {
      /* storage blocked: the preset still applies until reload */
    }
    showPreset();
  });
  showPreset();

  /* ---------- Icon gallery: one button per icon; a click copies its markup ---------- */

  const gallery = $("#icon-gallery");
  for (const name of Object.keys(VWA.icons)) {
    const button = h("button", { type: "button", "data-copy": `<i data-icon="${name}"></i>`, title: `Copy ${name}` }, h("span", { class: "place-center" }), name);
    button.firstElementChild.innerHTML = String(icon(name));
    gallery.append(button);
  }

  /* ---------- Forms ---------- */

  // The demo form only reaches this listener when every field is valid (ui.js stops invalid submits)
  on("#demo-form", "submit", (event) => {
    event.preventDefault();
    const data = formToObject(event.target);
    toast(`Registered ${data.name} as ${data.role}`, { type: "success" });
    event.target.reset();
  });

  // Segmented control: a group of radios, so a plain change event is enough
  on("#demo-filter", "change", (event) => {
    $("#demo-filter-output").textContent = event.target.value;
  });

  /* ---------- Two-step form: VWA.validate checks one step at a time ---------- */

  const wizard = $("#wizard-demo");

  function goToStep(number) {
    $$("[data-step]", wizard).forEach((step) => {
      step.hidden = step.dataset.step !== String(number);
    });
    $$(".stepper li", wizard).forEach((item, i) => {
      item.classList.toggle("is-done", i + 1 < number);
      if (i + 1 === number) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
    // Focus the first field of the new step, or the result message
    const current = $(`[data-step="${number}"]`, wizard);
    const target = $("input, select, textarea", current) || current;
    if (!target.matches("input, select, textarea")) target.tabIndex = -1;
    target.focus();
  }

  on(wizard, "click", "[data-next]", (event, button) => {
    if (VWA.validate(button.closest("[data-step]"))) goToStep(2);
  });
  on(wizard, "click", "[data-back]", () => goToStep(1));
  on(wizard, "submit", (event) => {
    event.preventDefault();
    goToStep(3);
  });

  /* ---------- File upload preview ---------- */

  const dropzone = $("#demo-dropzone");
  const fileInput = $("#demo-file");
  const preview = $("#demo-file-preview");

  function showFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      toast("Choose an image file (PNG, JPG or SVG)", { type: "warning" });
      return;
    }
    // A blob: URL shows the file without uploading it anywhere
    if (preview.src.startsWith("blob:")) URL.revokeObjectURL(preview.src);
    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
    toast(`${file.name} ready`, { type: "success", duration: 2000 });
  }

  on(fileInput, "change", () => showFile(fileInput.files[0]));
  on(dropzone, "dragover", (event) => {
    event.preventDefault(); // without this the browser opens the dropped file instead
    dropzone.classList.add("is-dragover");
  });
  on(dropzone, "dragleave", () => dropzone.classList.remove("is-dragover"));
  on(dropzone, "drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragover");
    showFile(event.dataTransfer.files[0]);
  });

  /* ---------- Charts ---------- */

  VWA.chart.bar("#demo-bar-chart", {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    values: [12, 18, 9, 22, 17, 26, 24],
    label: "Tasks completed per day",
    highlight: 5,
  });
  VWA.chart.line("#demo-line-chart", {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
    series: [
      { name: "Visits", values: [120, 180, 150, 240, 300] },
      { name: "Sign-ups", values: [20, 35, 30, 60, 90] },
    ],
    label: "Visits and sign-ups per week",
  });
  VWA.chart.donut("#demo-donut-chart", {
    segments: [
      { label: "Done", value: 8 },
      { label: "In progress", value: 3 },
      { label: "To do", value: 5 },
    ],
    label: "Tasks by status",
    centerLabel: "Tasks",
  });
})();

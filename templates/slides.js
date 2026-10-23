/*
  A pitch deck in one HTML file. Each <section class="slide"> is a slide.

    Arrow keys, Page Up / Page Down, Space   previous and next slide
    Home / End                                first and last slide
    F                                         full screen
    #3 in the address                         opens slide 3, and a reload stays there
    Ctrl+P                                    prints one slide per page (save as PDF)

  Swiping left or right also works on touch screens.
*/
(function () {
  "use strict";

  const { $, $$, on, icon, toast } = VWA;
  const slides = $$(".slide");
  const total = slides.length;
  const titles = slides.map((slide) => slide.getAttribute("aria-label"));
  const fullscreenButton = $('[data-action="fullscreen"]');
  let current = 0;

  // Scale the 1280 x 720 design to the room left by the controls
  function fit() {
    const stage = $(".deck-stage");
    const scale = Math.min(stage.clientWidth / 1280, stage.clientHeight / 720) * 0.95;
    document.documentElement.style.setProperty("--scale", scale.toFixed(4));
  }

  function go(index) {
    current = Math.max(0, Math.min(total - 1, index));
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle("is-active", active);
      slide.inert = !active; // hidden slides leave the tab order and the accessibility tree
      slide.setAttribute("aria-label", `${i + 1} of ${total}: ${titles[i]}`);
    });

    $(".deck-progress > span").style.setProperty("--value", `${((current + 1) / total) * 100}%`);
    $("#counter").innerHTML = `<span aria-hidden="true">${current + 1} / ${total}</span><span class="visually-hidden">Slide ${current + 1} of ${total}: ${titles[current]}</span>`;
    document.title = `${current + 1}. ${titles[current]} | Nimbus pitch`;

    // replaceState: the slide number is in the URL without a history entry per slide
    history.replaceState(null, "", `#${current + 1}`);
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      toast("Full screen is not available here. Press F11 instead.");
    }
  }

  const fromHash = () => {
    const number = parseInt(location.hash.slice(1), 10);
    return Number.isNaN(number) ? null : number - 1;
  };

  /* ---------- Start ---------- */

  fit();
  go(fromHash() ?? 0);

  VWA.chart.line("#traction-chart", {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
    series: [{ name: "Active teams", values: [6, 12, 21, 30, 40] }],
    label: "Active teams per week during the pilot",
    height: 300,
  });

  /* ---------- Controls ---------- */

  on(window, "resize", fit);
  on(window, "hashchange", () => {
    const index = fromHash();
    if (index !== null && index !== current) go(index);
  });

  on('[data-action="previous"]', "click", () => go(current - 1));
  on('[data-action="next"]', "click", () => go(current + 1));
  on(fullscreenButton, "click", toggleFullscreen);

  on(document, "fullscreenchange", () => {
    const active = Boolean(document.fullscreenElement);
    fullscreenButton.setAttribute("aria-pressed", String(active));
    fullscreenButton.setAttribute("aria-label", active ? "Exit full screen" : "Full screen");
    fullscreenButton.innerHTML = String(icon(active ? "minimize" : "maximize"));
  });

  on(document, "keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    // Space and Enter on a focused button should press that button, not change the slide
    const onControl = event.target instanceof Element && event.target.closest("button, a, input, select, textarea");
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
        go(current + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        go(current - 1);
        break;
      case " ":
        if (onControl) return;
        go(event.shiftKey ? current - 1 : current + 1);
        break;
      case "Home":
        go(0);
        break;
      case "End":
        go(total - 1);
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      default:
        return;
    }
    event.preventDefault();
  });

  // Swipe: a horizontal drag of more than 50px on the stage changes the slide
  let startX = null;
  on(".deck-stage", "pointerdown", (event) => {
    startX = event.clientX;
  });
  on(".deck-stage", "pointerup", (event) => {
    if (startX === null) return;
    const distance = event.clientX - startX;
    startX = null;
    if (Math.abs(distance) > 50) go(distance < 0 ? current + 1 : current - 1);
  });
})();

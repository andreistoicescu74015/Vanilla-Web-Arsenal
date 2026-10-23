/*
  Small SVG charts, in the spirit of Chart.js but much smaller: bar, line and donut.

    VWA.chart.bar("#sales", { labels: ["Mon", "Tue"], values: [12, 18], label: "Tasks per day" });
    VWA.chart.line("#visits", { labels, series: [{ name: "Visits", values: [...] }], label: "Visits" });
    VWA.chart.donut("#status", { segments: [{ label: "Done", value: 8 }, ...], label: "Task status" });

  Each call fills the target element and returns it. Call it again with new data to redraw.
  The charts redraw themselves when their container changes width, so text stays sharp.
  Colors come from tokens (--chart-1 to --chart-5 in charts.css): solid brand colors, and
  they follow the light and dark theme.

  Accessibility: the SVG is decoration for sighted users; the same numbers are in a table
  that only screen readers see (bar, line) or in the visible legend (donut).
  Load after dom.js and utils.js.
*/
(function () {
  "use strict";

  const VWA = (window.VWA = window.VWA || {});

  const escape = (value) => String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
  const defaultFormat = (value) => new Intl.NumberFormat(VWA.locale).format(value);

  // A round number a little above the largest value, so the top gridline has a clean label
  function niceMax(value) {
    if (value <= 0) return 1;
    const magnitude = 10 ** Math.floor(Math.log10(value));
    const steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
    return steps.map((step) => step * magnitude).find((candidate) => candidate >= value) || 10 * magnitude;
  }

  function dataTable(caption, headers, rows) {
    return `<table class="visually-hidden">
      <caption>${escape(caption)}</caption>
      <thead><tr>${headers.map((header) => `<th scope="col">${escape(header)}</th>`).join("")}</tr></thead>
      <tbody>${rows
        .map((row) => `<tr>${row.map((cell, i) => (i === 0 ? `<th scope="row">${escape(cell)}</th>` : `<td>${escape(cell)}</td>`)).join("")}</tr>`)
        .join("")}</tbody>
    </table>`;
  }

  /* Draws with the container's real width (1 SVG unit = 1 CSS pixel, so labels are always
     12px), and draws again when that width changes. */
  const observers = new WeakMap();

  function mount(target, draw) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    el.classList.add("chart");
    const render = () => {
      const width = Math.max(240, Math.round(el.clientWidth || 600));
      el.innerHTML = draw(width);
      el.dataset.width = String(width);
    };
    // Bars animate when new data is drawn, not on every resize
    el.classList.remove("is-drawn");
    render();
    clearTimeout(el.drawnTimer);
    el.drawnTimer = setTimeout(() => el.classList.add("is-drawn"), 1200);

    observers.get(el)?.disconnect();
    const observer = new ResizeObserver(() => {
      if (Math.abs((el.clientWidth || 0) - Number(el.dataset.width)) > 8) render();
    });
    observer.observe(el);
    observers.set(el, observer);
    return el;
  }

  function grid(width, top, plotHeight, max, format, left = 0) {
    let out = "";
    for (let i = 0; i <= 4; i++) {
      const y = top + plotHeight - (plotHeight * i) / 4;
      out += `<line class="chart-grid" x1="${left}" x2="${width}" y1="${y}" y2="${y}"/>`;
      if (left) out += `<text class="chart-axis" x="${left - 8}" y="${y + 4}" text-anchor="end">${escape(format((max * i) / 4))}</text>`;
    }
    return out;
  }

  /**
   * Vertical bars with the value on top of each one.
   * options: labels, values, label (describes the chart), height = 240,
   *          format(value) for the numbers, highlight = index of a bar to color with --chart-2
   */
  function bar(target, { labels, values, label = "Bar chart", height = 240, format = defaultFormat, highlight } = {}) {
    return mount(target, (width) => {
      const top = 24;
      const bottom = 28;
      const plotHeight = height - top - bottom;
      const max = niceMax(Math.max(...values));
      const slot = width / values.length;
      const barWidth = Math.max(8, slot * 0.62);

      const bars = values
        .map((value, i) => {
          const h = (value / max) * plotHeight;
          const x = i * slot + (slot - barWidth) / 2;
          const y = top + plotHeight - h;
          const cls = i === highlight ? "chart-bar is-highlight" : "chart-bar";
          return `<g>
            <title>${escape(labels[i])}: ${escape(format(value))}</title>
            <rect class="${cls}" style="--i: ${i}" x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="4"/>
            <text class="chart-value" x="${x + barWidth / 2}" y="${y - 7}" text-anchor="middle">${escape(format(value))}</text>
            <text class="chart-label" x="${x + barWidth / 2}" y="${height - 8}" text-anchor="middle">${escape(labels[i])}</text>
          </g>`;
        })
        .join("");

      return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true" focusable="false">
          ${grid(width, top, plotHeight, max, format)}${bars}
        </svg>
        ${dataTable(label, ["Label", "Value"], labels.map((name, i) => [name, format(values[i])]))}`;
    });
  }

  /**
   * One or more lines over the same labels, with a light area under the first one.
   * options: labels, series: [{ name, values }], label, height = 240, format
   */
  function line(target, { labels, series, label = "Line chart", height = 240, format = defaultFormat } = {}) {
    return mount(target, (width) => {
      const top = 16;
      const bottom = 28;
      const left = 44;
      const right = 12;
      const plotHeight = height - top - bottom;
      const plotWidth = width - left - right;
      const max = niceMax(Math.max(...series.flatMap((s) => s.values)));
      const x = (i) => left + (labels.length === 1 ? plotWidth / 2 : (plotWidth * i) / (labels.length - 1));
      const y = (value) => top + plotHeight - (value / max) * plotHeight;

      const lines = series
        .map((s, index) => {
          const points = s.values.map((value, i) => `${x(i)},${y(value)}`).join(" ");
          const area =
            index === 0
              ? `<polygon class="chart-area" style="--color: var(--chart-1)" points="${x(0)},${top + plotHeight} ${points} ${x(s.values.length - 1)},${top + plotHeight}"/>`
              : "";
          const dots = s.values
            .map((value, i) => `<circle class="chart-dot" style="--color: var(--chart-${index + 1})" cx="${x(i)}" cy="${y(value)}" r="4"><title>${escape(s.name)}, ${escape(labels[i])}: ${escape(format(value))}</title></circle>`)
            .join("");
          return `${area}<polyline class="chart-line" style="--color: var(--chart-${index + 1})" points="${points}"/>${dots}`;
        })
        .join("");

      const xLabels = labels
        .map((name, i) => `<text class="chart-label" x="${x(i)}" y="${height - 8}" text-anchor="middle">${escape(name)}</text>`)
        .join("");

      const legend =
        series.length > 1
          ? `<ul class="chart-legend" aria-hidden="true">${series
              .map((s, i) => `<li><span class="chart-swatch" style="--color: var(--chart-${i + 1})"></span>${escape(s.name)}</li>`)
              .join("")}</ul>`
          : "";

      return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true" focusable="false">
          ${grid(width - right, top, plotHeight, max, format, left)}${lines}${xLabels}
        </svg>
        ${legend}
        ${dataTable(label, ["Label", ...series.map((s) => s.name)], labels.map((name, i) => [name, ...series.map((s) => format(s.values[i]))]))}`;
    });
  }

  /**
   * A ring split into segments, with the total in the middle and a legend beside it.
   * options: segments: [{ label, value }], label, centerLabel = "Total", format, size = 180
   */
  function donut(target, { segments, label = "Donut chart", centerLabel = "Total", format = defaultFormat, size = 180 } = {}) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    el.classList.add("chart", "chart-donut");
    const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
    const radius = size / 2 - 14;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    const rings = segments
      .map((s, i) => {
        const length = (s.value / total) * circumference;
        const ring = `<circle class="chart-segment" style="--color: var(--chart-${(i % 5) + 1})" cx="${size / 2}" cy="${size / 2}" r="${radius}"
          stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${-offset}"><title>${escape(s.label)}: ${escape(format(s.value))}</title></circle>`;
        offset += length;
        return ring;
      })
      .join("");

    el.innerHTML = `
      <div class="chart-donut-figure">
        <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true" focusable="false">
          <circle class="chart-donut-track" cx="${size / 2}" cy="${size / 2}" r="${radius}"/>
          <g transform="rotate(-90 ${size / 2} ${size / 2})">${rings}</g>
        </svg>
        <div class="chart-donut-center" aria-hidden="true"><strong>${escape(format(total))}</strong><span>${escape(centerLabel)}</span></div>
      </div>
      <ul class="chart-legend chart-legend-list" aria-label="${escape(label)}">
        ${segments
          .map((s, i) => `<li><span class="chart-swatch" style="--color: var(--chart-${(i % 5) + 1})"></span><span>${escape(s.label)}</span><strong>${escape(format(s.value))}</strong><span class="text-muted">${Math.round((s.value / total) * 100)}%</span></li>`)
          .join("")}
      </ul>`;
    return el;
  }

  VWA.chart = { bar, line, donut };
})();

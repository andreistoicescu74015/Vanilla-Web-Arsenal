/*
  Dashboard behavior: charts, task table and the "New task" dialog.
  The task table goes through every state a real data view needs:
  loading (skeleton), loaded, empty (no match), and error (with a retry button).
*/
(function () {
  "use strict";

  const { $, on, html, render, debounce, formatDate, toast, formToObject } = VWA;

  /* ---------- Bar chart ---------- */

  const CHART = {
    week: { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], values: [12, 18, 9, 22, 17, 26, 24], label: "Tasks completed per day this week" },
    month: { labels: ["Week 1", "Week 2", "Week 3", "Week 4"], values: [64, 82, 71, 96], label: "Tasks completed per week this month" },
  };

  const renderChart = (period) => VWA.chart.bar("#chart", CHART[period]);

  renderChart("week");
  on(document, "change", 'input[name="period"]', (event, radio) => renderChart(radio.value));

  /* ---------- Tasks ---------- */

  const api = VWA.createMockApi("dashboard-tasks", { seed: VWA.sample.tasks, delay: 700 });
  const PRIORITY_BADGE = { high: "badge-danger", medium: "badge-warning", low: "badge-info" };
  const list = $("#tasks");
  const status = $("#tasks-status");

  let tasks = [];
  let filter = "all";
  let query = "";

  // Placeholder rows with the same columns as the real table
  const skeleton = html`
    <div class="table-wrap" aria-hidden="true">
      ${[1, 2, 3, 4, 5].map(
        () => html`
          <div class="skeleton-row">
            <div class="skeleton" style="width: 1.125rem; height: 1.125rem"></div>
            <div class="skeleton grow"></div>
            <div class="skeleton hide-mobile" style="width: 4.5rem"></div>
            <div class="skeleton hide-mobile" style="width: 4rem"></div>
            <div class="skeleton" style="width: 5.5rem"></div>
          </div>`
      )}
    </div>`;

  const row = (task) => html`
    <tr>
      <td>
        <label class="check">
          <input type="checkbox" data-toggle="${task.id}" ${task.done ? "checked" : ""}>
          <span class="${task.done ? "text-muted" : ""}">${task.title}</span>
        </label>
      </td>
      <td data-label="Tag"><span class="badge">${task.tag || "General"}</span></td>
      <td data-label="Priority"><span class="badge ${PRIORITY_BADGE[task.priority]}">${task.priority}</span></td>
      <td data-label="Due" class="text-muted">${task.due ? formatDate(task.due) : "No date"}</td>
    </tr>`;

  /* Status split for the donut: finished, open and urgent, open and not urgent */
  function renderStatus() {
    const done = tasks.filter((task) => task.done).length;
    const urgent = tasks.filter((task) => !task.done && task.priority === "high").length;
    VWA.chart.donut("#status-chart", {
      label: "Tasks by status",
      centerLabel: "tasks",
      segments: [
        { label: "Done", value: done },
        { label: "Open, high priority", value: urgent },
        { label: "Open, other", value: tasks.length - done - urgent },
      ],
    });
  }

  function renderTasks() {
    // Rendering replaces the checkboxes, so remember which one had focus and restore it
    const focusedId = document.activeElement?.dataset?.toggle;

    const visible = tasks.filter(
      (task) =>
        (filter === "all" || (filter === "done") === task.done) && task.title.toLowerCase().includes(query.toLowerCase())
    );

    status.textContent = visible.length
      ? `${visible.length} ${visible.length === 1 ? "task" : "tasks"} shown`
      : "No tasks match";

    if (!visible.length) {
      render(list, html`
        <div class="empty-state">
          <i data-icon="search"></i>
          <h3>No tasks match</h3>
          <p>Try another filter or search term.</p>
        </div>`);
      return;
    }

    render(list, html`
      <div class="table-wrap">
        <table class="table table-stacked">
          <thead>
            <tr><th scope="col">Task</th><th scope="col">Tag</th><th scope="col">Priority</th><th scope="col">Due</th></tr>
          </thead>
          <tbody>${visible.map(row)}</tbody>
        </table>
      </div>`);

    if (focusedId) $(`[data-toggle="${focusedId}"]`)?.focus();
  }

  async function loadTasks() {
    list.setAttribute("aria-busy", "true");
    status.textContent = "Loading tasks";
    render(list, skeleton);
    try {
      tasks = await api.list();
      renderTasks();
      renderStatus();
    } catch (error) {
      status.textContent = "Could not load tasks";
      render(list, html`
        <div class="alert alert-danger" role="alert">
          <i data-icon="alert-circle"></i>
          <div class="stack" style="--gap: var(--space-xs)">
            <p class="alert-title">Could not load tasks</p>
            <p>${error.message}</p>
            <button class="btn btn-sm btn-outline" type="button" data-retry>Try again</button>
          </div>
        </div>`);
    } finally {
      list.setAttribute("aria-busy", "false");
    }
  }

  loadTasks();

  on(list, "click", "[data-retry]", loadTasks);

  on(document, "change", 'input[name="filter"]', (event, radio) => {
    filter = radio.value;
    renderTasks();
  });

  on("#search", "input", debounce((event) => {
    query = event.target.value.trim();
    renderTasks();
  }, 200));

  // Optimistic update: change the screen first, undo it if the save fails
  on(list, "change", "[data-toggle]", async (event, box) => {
    const id = Number(box.dataset.toggle);
    const task = tasks.find((item) => item.id === id);
    task.done = box.checked;
    renderTasks();
    renderStatus();
    try {
      await api.update(id, { done: task.done });
      toast(task.done ? "Task completed" : "Task reopened", { type: task.done ? "success" : "info", duration: 2000 });
    } catch {
      task.done = !task.done;
      renderTasks();
      renderStatus();
      toast("Could not save the change", { type: "danger" });
    }
  });

  /* ---------- New task dialog ---------- */

  // Default due date: two days from now, as the local yyyy-mm-dd that date inputs expect
  // (toISOString() would give the UTC date, which is a day off around midnight)
  on("[data-dialog-open='new-task']", "click", () => {
    const due = new Date();
    due.setDate(due.getDate() + 2);
    const pad = (n) => String(n).padStart(2, "0");
    $("#task-due").value = `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}`;
  });

  // ui.js only lets valid submits through, and blocks a second submit while this one is busy
  on("#new-task-form", "submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const button = form.querySelector('[type="submit"]');
    button.setAttribute("aria-busy", "true");
    try {
      const task = await api.create({ ...formToObject(form), done: false, tag: "General" });
      tasks = [task, ...tasks];
      renderTasks();
      renderStatus();
      form.reset();
      $("#new-task").close();
      toast(`Created "${task.title}"`, { type: "success" });
    } catch {
      toast("Could not create the task", { type: "danger" });
    } finally {
      button.removeAttribute("aria-busy");
    }
  });
})();

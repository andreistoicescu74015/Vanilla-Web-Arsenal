/*
  A small single-page app, organized the way React and Vue apps are:

    state    VWA.createStore holds the data; nothing else keeps a copy
    actions  async functions that call the API and then update the state
    views    functions that return html`` for a page; mount() draws the page once,
             update(state) redraws only the parts that depend on the data
    router   VWA.createRouter picks the view from the URL hash

  Pages: #/ (task list), #/tasks/:id (edit a task), #/stats, #/about, anything else is a 404.
  Turn on "Simulate a flaky network" in the footer to see the error states.
*/
(function () {
  "use strict";

  const { $, on, html, render, createStore, createRouter, createMockApi, formatDate, toast, confirm, formToObject } = VWA;
  const viewRoot = $("#view");

  /* ---------- Data source ---------- */

  const makeApi = (failRate) => createMockApi("app-tasks", { seed: VWA.sample.tasks, failRate });
  let api = makeApi(0);

  on("#flaky", "change", (event) => {
    api = makeApi(event.target.checked ? 0.4 : 0);
    toast(event.target.checked ? "4 in 10 requests will now fail" : "Network back to normal");
  });

  /* ---------- State ---------- */

  const store = createStore({ tasks: [], status: "loading", error: "", filter: "all" });

  /* ---------- Actions ---------- */

  // Shows a toast instead of letting a failed request break the page
  const attempt = async (work, failMessage) => {
    try {
      return await work();
    } catch (error) {
      toast(`${failMessage}: ${error.message}`, { type: "danger" });
      return null;
    }
  };

  async function loadTasks() {
    store.set({ status: "loading", error: "" });
    try {
      store.set({ tasks: await api.list(), status: "ready" });
    } catch (error) {
      store.set({ status: "error", error: error.message });
    }
  }

  const addTask = (title) =>
    attempt(async () => {
      const task = await api.create({ title, priority: "medium", done: false, due: "", tag: "General" });
      store.set((state) => ({ tasks: [task, ...state.tasks] }));
      return task;
    }, "Could not add the task");

  const updateTask = (id, changes) =>
    attempt(async () => {
      const task = await api.update(id, changes);
      store.set((state) => ({ tasks: state.tasks.map((item) => (item.id === task.id ? task : item)) }));
      return task;
    }, "Could not save");

  // Undo for "Clear completed": the mock API gives the tasks back with new ids
  const restoreTasks = (removed) =>
    attempt(async () => {
      const restored = [];
      for (const { id, createdAt, updatedAt, ...data } of removed) restored.push(await api.create(data));
      store.set((state) => ({ tasks: [...restored, ...state.tasks] }));
      return restored;
    }, "Could not restore");

  const deleteTask = (id) =>
    attempt(async () => {
      await api.remove(id);
      store.set((state) => ({ tasks: state.tasks.filter((item) => item.id !== id) }));
      return true;
    }, "Could not delete");

  /* ---------- Small view helpers ---------- */

  const PRIORITY_BADGE = { high: "badge-danger", medium: "badge-warning", low: "badge-info" };

  const skeletonRows = html`
    <div class="card"><div class="card-body" aria-hidden="true">
      ${[1, 2, 3, 4].map(() => html`<div class="skeleton" style="height: 1.75rem"></div>`)}
    </div></div>`;

  const errorBox = (message) => html`
    <div class="alert alert-danger" role="alert">
      <i data-icon="alert-circle"></i>
      <div class="stack" style="--gap: var(--space-xs)">
        <p class="alert-title">Could not load your tasks</p>
        <p>${message}</p>
        <button class="btn btn-sm btn-outline" type="button" data-action="retry">Try again</button>
      </div>
    </div>`;

  /* ---------- Views ---------- */

  const views = {
    list: {
      title: "Tasks",
      mount: () => html`
        <div class="stack" style="--gap: var(--space-l)">
          <div class="split">
            <h1 class="text-3xl" tabindex="-1">Tasks</h1>
            <fieldset class="segmented">
              <legend class="visually-hidden">Show</legend>
              ${["all", "active", "done"].map(
                (filter) => html`<label><input type="radio" name="filter" value="${filter}" ${store.get().filter === filter ? "checked" : ""}> ${filter[0].toUpperCase() + filter.slice(1)}</label>`
              )}
            </fieldset>
          </div>
          <form class="input-group" id="add-form">
            <label class="visually-hidden" for="new-title">New task</label>
            <input class="input" id="new-title" name="title" placeholder="What needs doing?" autocomplete="off" required>
            <button class="btn btn-primary" type="submit"><i data-icon="plus"></i> Add</button>
          </form>
          <div id="task-list"></div>
        </div>`,

      update(state) {
        const list = $("#task-list");
        if (!list) return;
        // Redrawing replaces the elements, so remember which checkbox had focus and restore it
        const focusedId = document.activeElement?.dataset?.toggle;

        if (state.status === "loading") return render(list, skeletonRows);
        if (state.status === "error") return render(list, errorBox(state.error));

        if (!state.tasks.length) {
          announce("No tasks yet");
          return render(list, html`
            <div class="empty-state">
              <i data-icon="check-circle"></i>
              <h2>No tasks yet</h2>
              <p>Add your first task above. It is saved in this browser.</p>
            </div>`);
        }

        const visible = state.tasks.filter(
          (task) => state.filter === "all" || (state.filter === "done" ? task.done : !task.done)
        );
        const left = state.tasks.filter((task) => !task.done).length;
        announce(`${visible.length} ${visible.length === 1 ? "task" : "tasks"} shown, ${left} left to do`);

        render(list, html`
          <div class="card">
            ${visible.length
              ? html`<ul role="list">
                  ${visible.map((task) => html`
                    <li class="task ${task.done ? "is-done" : ""}">
                      <input type="checkbox" data-toggle="${task.id}" ${task.done ? "checked" : ""} aria-label="Mark ${task.title} as done">
                      <a href="#/tasks/${task.id}" class="truncate">${task.title}</a>
                      <span class="badge ${PRIORITY_BADGE[task.priority] || ""}">${task.priority}</span>
                      <button class="btn btn-ghost btn-icon btn-sm" type="button" data-delete="${task.id}" aria-label="Delete ${task.title}"><i data-icon="trash"></i></button>
                    </li>`)}
                </ul>`
              : html`<p class="p-l text-center text-muted">Nothing in this list.</p>`}
            <div class="card-footer split text-sm text-muted">
              <span>${left} ${left === 1 ? "task" : "tasks"} left</span>
              <button class="btn btn-ghost btn-sm" type="button" data-action="clear-done">Clear completed</button>
            </div>
          </div>`);

        if (focusedId) $(`[data-toggle="${focusedId}"]`)?.focus();
      },
    },

    detail: {
      title: "Edit task",
      mount: () => html`<div id="detail">${skeletonRows}</div>`,

      update(state, { id }) {
        const container = $("#detail");
        // Draw the form only once, so typing is never interrupted by a redraw
        if (!container || container.querySelector("form")) return;
        if (state.status === "loading") return;
        if (state.status === "error") return render(container, errorBox(state.error));

        const task = state.tasks.find((item) => String(item.id) === id);
        if (!task) return render(container, views.notFound.mount());

        render(container, html`
          <div class="stack" style="--gap: var(--space-l)">
            <nav class="breadcrumbs" aria-label="Breadcrumb">
              <ol><li><a href="#/">Tasks</a></li><li><span aria-current="page">${task.title}</span></li></ol>
            </nav>
            <h1 class="text-3xl" tabindex="-1">Edit task</h1>
            <form class="card" id="edit-form" data-validate data-id="${task.id}">
              <div class="card-body" style="--gap: var(--space-m)">
                <div class="field">
                  <label class="label" for="edit-title">Title</label>
                  <input class="input" id="edit-title" name="title" value="${task.title}" required minlength="3">
                </div>
                <div class="cols-2" style="--gap: var(--space-m)">
                  <div class="field">
                    <label class="label" for="edit-priority">Priority</label>
                    <select class="input" id="edit-priority" name="priority">
                      ${["low", "medium", "high"].map((p) => html`<option value="${p}" ${task.priority === p ? "selected" : ""}>${p}</option>`)}
                    </select>
                  </div>
                  <div class="field">
                    <label class="label" for="edit-due">Due date <span class="text-muted font-normal">(optional)</span></label>
                    <input class="input" id="edit-due" name="due" type="date" value="${task.due || ""}">
                  </div>
                </div>
                <div class="field">
                  <label class="label" for="edit-notes">Notes <span class="text-muted font-normal">(optional)</span></label>
                  <textarea class="input" id="edit-notes" name="notes">${task.notes || ""}</textarea>
                </div>
                <label class="switch"><input type="checkbox" role="switch" name="done" ${task.done ? "checked" : ""}> Done</label>
              </div>
              <div class="card-footer split">
                <button class="btn btn-ghost text-danger" type="button" data-delete="${task.id}"><i data-icon="trash"></i> Delete</button>
                <div class="cluster">
                  <a class="btn btn-ghost" href="#/">Cancel</a>
                  <button class="btn btn-primary" type="submit">Save changes</button>
                </div>
              </div>
            </form>
            <p class="text-sm text-muted">Created ${formatDate(task.createdAt || Date.now(), { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>`);
      },
    },

    stats: {
      title: "Stats",
      mount: () => html`
        <div class="stack" style="--gap: var(--space-l)">
          <h1 class="text-3xl" tabindex="-1">Stats</h1>
          <div id="stats"></div>
        </div>`,

      update(state) {
        const target = $("#stats");
        if (!target) return;
        if (state.status === "loading") return render(target, skeletonRows);
        if (state.status === "error") return render(target, errorBox(state.error));

        const total = state.tasks.length;
        const done = state.tasks.filter((task) => task.done).length;
        const percent = total ? Math.round((done / total) * 100) : 0;
        const byPriority = Object.groupBy(state.tasks, (task) => task.priority);

        render(target, html`
          <div class="stack" style="--gap: var(--space-l)">
            <div class="card"><div class="card-body">
              <div class="split"><strong>Completion</strong><span class="text-muted">${done} of ${total} done</span></div>
              <div class="progress" role="progressbar" aria-label="Completion" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100" style="--value: ${percent}%"><span></span></div>
            </div></div>
            <div class="card"><div class="card-body" style="--gap: var(--space-m)">
              <h2 class="text-lg">Tasks by priority</h2>
              <div id="priority-chart"></div>
            </div></div>
          </div>`);

        VWA.chart.donut("#priority-chart", {
          label: "Tasks by priority",
          centerLabel: "tasks",
          segments: ["high", "medium", "low"].map((priority) => ({
            label: `${priority[0].toUpperCase() + priority.slice(1)} priority`,
            value: (byPriority[priority] || []).length,
          })),
        });
      },
    },

    about: {
      title: "About",
      mount: () => html`
        <article class="prose">
          <h1 class="text-3xl" tabindex="-1">How this app works</h1>
          <p>This page is one HTML file and one script. There is no framework and no build step.</p>
          <ul>
            <li><strong>Router.</strong> The part of the URL after <code>#</code> decides which view is drawn.</li>
            <li><strong>Store.</strong> All data lives in one object; every change redraws the parts that depend on it.</li>
            <li><strong>Mock API.</strong> Requests take a few hundred milliseconds and are saved in localStorage.</li>
          </ul>
          <p>Read <code>templates/app.js</code> from top to bottom: it is written to be copied.</p>
          <p><a class="btn btn-primary" href="#/">Back to tasks</a></p>
        </article>`,
    },

    notFound: {
      title: "Not found",
      mount: () => html`
        <div class="empty-state">
          <i data-icon="alert-triangle"></i>
          <h1 class="text-2xl" tabindex="-1">Page not found</h1>
          <p>The link may be old, or the task was deleted.</p>
          <a class="btn btn-primary" href="#/">Go to tasks</a>
        </div>`,
    },
  };

  /* ---------- Showing a view ---------- */

  // One visually hidden status line, announced by screen readers, instead of the whole list
  const statusLine = $("#list-status");
  const announce = (message) => {
    if (statusLine.textContent !== message) statusLine.textContent = message;
  };

  let current = { view: views.list, params: {} };
  let firstRender = true;

  function show(name, params = {}) {
    current = { view: views[name], params };
    document.title = `${current.view.title} | Nimbus`;
    render(viewRoot, current.view.mount());
    current.view.update?.(store.get(), params);

    // After navigating, move focus to the new heading so keyboard and screen reader
    // users start at the top of the new page (skip it on the first load)
    if (!firstRender) {
      window.scrollTo(0, 0);
      $("#view h1")?.focus();
    }
    firstRender = false;
  }

  store.subscribe((state) => current.view.update?.(state, current.params), { immediate: false });

  createRouter(
    {
      "/": () => show("list"),
      "/tasks/:id": ({ params }) => show("detail", params),
      "/stats": () => show("stats"),
      "/about": () => show("about"),
      "*": () => show("notFound"),
    },
    {
      onChange: ({ path }) => {
        document.querySelectorAll("#app-nav a").forEach((link) => {
          const section = link.getAttribute("href").slice(1);
          const active = section === "/" ? path === "/" || path.startsWith("/tasks") : path.startsWith(section);
          link.toggleAttribute("aria-current", active);
          if (active) link.setAttribute("aria-current", "page");
        });
      },
    }
  );

  loadTasks();

  /* ---------- Events (delegated, so they survive redraws) ---------- */

  on(viewRoot, "submit", "#add-form", async (event, form) => {
    event.preventDefault();
    // form.elements.title, not form.title: form.title is the form's own title attribute
    const title = form.elements.title.value.trim();
    if (!title) return;
    form.reset();
    if (await addTask(title)) toast("Task added", { type: "success", duration: 2000 });
    $("#new-title")?.focus();
  });

  on(viewRoot, "change", "[data-toggle]", (event, box) => {
    updateTask(Number(box.dataset.toggle), { done: box.checked });
  });

  on(viewRoot, "click", "[data-delete]", async (event, button) => {
    const id = Number(button.dataset.delete);
    const task = store.get().tasks.find((item) => item.id === id);
    const ok = await confirm(`"${task.title}" will be removed for everyone.`, { title: "Delete this task?", confirmText: "Delete", danger: true });
    if (ok && (await deleteTask(id))) {
      toast("Task deleted", { type: "success", duration: 2000 });
      if (location.hash !== "#/") location.hash = "#/";
    }
  });

  on(viewRoot, "click", '[data-action="retry"]', loadTasks);

  // No confirmation dialog here: the toast offers Undo instead, which interrupts less
  on(viewRoot, "click", '[data-action="clear-done"]', async () => {
    const done = store.get().tasks.filter((task) => task.done);
    if (!done.length) return toast("No completed tasks to clear");
    const removed = [];
    for (const task of done) if (await deleteTask(task.id)) removed.push(task);
    if (!removed.length) return;
    toast(`Cleared ${removed.length} completed ${removed.length === 1 ? "task" : "tasks"}`, {
      type: "success",
      duration: 6000,
      action: {
        label: "Undo",
        onClick: async () => {
          if (await restoreTasks(removed)) toast("Tasks restored", { type: "success", duration: 2000 });
        },
      },
    });
  });

  on(viewRoot, "change", 'input[name="filter"]', (event, radio) => store.set({ filter: radio.value }));

  // ui.js only lets valid edits through
  on(viewRoot, "submit", "#edit-form", async (event, form) => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    button.setAttribute("aria-busy", "true");
    const data = formToObject(form);
    const saved = await updateTask(Number(form.dataset.id), { ...data, done: "done" in data });
    button.removeAttribute("aria-busy");
    if (saved) {
      toast("Changes saved", { type: "success" });
      location.hash = "#/";
    }
  });
})();

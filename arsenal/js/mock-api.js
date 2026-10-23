/*
  A fake backend that lives in the browser, in the spirit of json-server and MSW.
  Build the whole frontend (loading states, errors, create/edit/delete) before a real
  API exists, or demo an app with no server at all.

    const tasks = VWA.createMockApi("tasks", { seed: VWA.sample.tasks });

    await tasks.list();                               // every item
    await tasks.list((task) => !task.done);           // filtered
    await tasks.get(3);                               // one item, or an error with status 404
    await tasks.create({ title: "Write README" });    // adds id and createdAt
    await tasks.update(3, { done: true });            // merges the changes, adds updatedAt
    await tasks.remove(3);
    await tasks.reset();                              // back to the seed data

  Every call returns a Promise and waits `delay` ms (randomized a little), so your
  spinners and skeletons get a chance to show. Data is saved in localStorage under
  "mock:<name>" and survives reloads. Set failRate: 0.2 to make 20% of calls fail
  with status 503 and check that your error states work.

  Swapping to a real API later means replacing these calls with VWA.http calls.
*/
(function () {
  "use strict";

  const VWA = (window.VWA = window.VWA || {});

  VWA.createMockApi = (name, { seed = [], delay = 350, failRate = 0 } = {}) => {
    const key = `mock:${name}`;
    const clone = (value) => JSON.parse(JSON.stringify(value));

    let items;
    try {
      items = JSON.parse(localStorage.getItem(key)) || clone(seed);
    } catch {
      items = clone(seed);
    }

    const save = () => {
      try {
        localStorage.setItem(key, JSON.stringify(items));
      } catch {
        /* storage blocked: data lives until the page reloads */
      }
    };

    const fail = (message, status) => {
      const error = new Error(`${name}: ${message}`);
      error.status = status;
      throw error;
    };

    const respond = (work) =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            if (Math.random() < failRate) fail("simulated network error", 503);
            resolve(clone(work()));
          } catch (error) {
            reject(error);
          }
        }, delay * (0.6 + Math.random() * 0.8));
      });

    const same = (a, b) => String(a) === String(b);
    const find = (id) => items.find((item) => same(item.id, id)) || fail(`no item with id ${id}`, 404);
    const nextId = () => Math.max(0, ...items.map((item) => Number(item.id) || 0)) + 1;

    return {
      list: (filter) => respond(() => (filter ? items.filter(filter) : items)),

      get: (id) => respond(() => find(id)),

      create: (data) =>
        respond(() => {
          const item = { id: nextId(), createdAt: new Date().toISOString(), ...data };
          items = [item, ...items];
          save();
          return item;
        }),

      update: (id, changes) =>
        respond(() => {
          const item = { ...find(id), ...changes, updatedAt: new Date().toISOString() };
          items = items.map((existing) => (same(existing.id, id) ? item : existing));
          save();
          return item;
        }),

      remove: (id) =>
        respond(() => {
          find(id);
          items = items.filter((item) => !same(item.id, id));
          save();
          return { id };
        }),

      /** Back to the seed data. Returns a Promise like the other methods, without the delay. */
      reset() {
        items = clone(seed);
        save();
        return Promise.resolve();
      },
    };
  };
})();

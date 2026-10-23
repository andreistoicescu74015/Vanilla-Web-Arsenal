/*
  A multi-step registration form. The pattern works for any long form: onboarding,
  booking, checkout, applications.

    - One <form> with one <section data-step> per step; only the current one is visible.
    - "Next" checks only the current step with VWA.validate(section).
    - Every answer goes into a store saved in localStorage, so a reload keeps the
      progress, and the Review step reads everything back from that store.
    - After each move, focus goes to the new step's heading, so keyboard and screen
      reader users start reading at the top of the step.
*/
(function () {
  "use strict";

  const { $, $$, on, html, render, createStore, confirm, sleep } = VWA;
  const form = $("#wizard");
  const STEPS = 4;
  const MIN_MEMBERS = 2;
  const MAX_MEMBERS = 5;
  const MAX_LOGO_BYTES = 2 * 1024 * 1024;
  const FIELDS = ["teamName", "track", "experience", "projectName", "idea", "repo"];

  const blankMember = () => ({ name: "", email: "" });
  const initialData = {
    teamName: "",
    track: "",
    experience: "",
    members: [blankMember(), blankMember()],
    projectName: "",
    idea: "",
    repo: "",
    logo: null,
  };

  const store = createStore(
    { step: 1, returnToReview: false, done: false, reference: "", data: initialData },
    { persist: "wizard-registration" }
  );

  const saveData = (changes) => store.set((state) => ({ data: { ...state.data, ...changes } }));

  const formatSize = (bytes) => (bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

  /* ---------- Members ---------- */

  function renderMembers(members) {
    render("#members", html`${members.map((member, i) => html`
      <div class="member" role="group" aria-labelledby="member-${i}-title">
        <p class="text-sm font-semibold" id="member-${i}-title">Member ${i + 1}${i === 0 ? " (you)" : ""}</p>
        <div class="field">
          <label class="label" for="member-${i}-name">Name</label>
          <input class="input" id="member-${i}-name" data-member="${i}" data-key="name" value="${member.name}" required autocomplete="${i === 0 ? "name" : "off"}">
        </div>
        <div class="field">
          <label class="label" for="member-${i}-email">Email</label>
          <input class="input" id="member-${i}-email" type="email" data-member="${i}" data-key="email" value="${member.email}" required autocomplete="${i === 0 ? "email" : "off"}">
        </div>
        <button class="btn btn-ghost btn-icon" type="button" data-remove-member="${i}" aria-label="Remove member ${i + 1}" ${members.length <= MIN_MEMBERS ? "disabled" : ""}><i data-icon="trash"></i></button>
      </div>`)}`);
    $('[data-action="add-member"]').disabled = members.length >= MAX_MEMBERS;
  }

  /* ---------- Logo upload ---------- */

  function renderLogo(logo) {
    $("#dropzone").hidden = Boolean(logo);
    $("#logo-preview").hidden = !logo;
    if (!logo) return;
    $("#logo-image").src = logo.dataUrl;
    $("#logo-name").textContent = logo.name;
    $("#logo-size").textContent = formatSize(logo.size);
  }

  function handleFile(file) {
    const input = $("#logo");
    if (!file) return;
    const problem = !file.type.startsWith("image/")
      ? "Choose an image file: PNG, JPG or SVG."
      : file.size > MAX_LOGO_BYTES
        ? `That image is ${formatSize(file.size)}. Choose one under 2 MB.`
        : "";

    // The custom message blocks "Next" like any other error until a valid image is chosen
    input.setCustomValidity(problem);
    if (problem) {
      VWA.validate(input.closest(".field"));
      return;
    }

    // A data: URL can be saved in localStorage, so the preview survives a reload
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      saveData({ logo: { name: file.name, size: file.size, dataUrl: reader.result } });
      renderLogo(store.get().data.logo);
      VWA.validate(input.closest(".field")); // clears an earlier error message
      $('[data-action="remove-logo"]').focus();
    });
    reader.readAsDataURL(file);
  }

  /* ---------- Review ---------- */

  const editButton = (step, what) =>
    html`<button class="btn btn-ghost btn-sm" type="button" data-goto="${step}" aria-label="Edit ${what}"><i data-icon="edit"></i> Edit</button>`;

  function renderReview(data) {
    render("#review", html`
      <div class="review-block stack" style="--gap: var(--space-s)">
        <div class="split"><h3 class="text-lg">Team</h3>${editButton(1, "team")}</div>
        <dl class="summary">
          <dt>Name</dt><dd>${data.teamName}</dd>
          <dt>Track</dt><dd>${data.track}</dd>
          <dt>Experience</dt><dd>${data.experience}</dd>
        </dl>
      </div>
      <div class="review-block stack" style="--gap: var(--space-s)">
        <div class="split"><h3 class="text-lg">Members (${data.members.length})</h3>${editButton(2, "members")}</div>
        <ul role="list" class="stack" style="--gap: var(--space-xs)">
          ${data.members.map((member) => html`
            <li class="flex items-center gap-s">
              <span class="avatar" style="--size: 2rem">${initials(member.name)}</span>
              <span class="min-w-0"><strong class="block truncate">${member.name}</strong><span class="text-sm text-muted">${member.email}</span></span>
            </li>`)}
        </ul>
      </div>
      <div class="stack" style="--gap: var(--space-s)">
        <div class="split"><h3 class="text-lg">Project</h3>${editButton(3, "project")}</div>
        <dl class="summary">
          <dt>Name</dt><dd>${data.projectName || html`<span class="text-muted">Not decided yet</span>`}</dd>
          <dt>Idea</dt><dd>${data.idea}</dd>
          <dt>Repository</dt><dd>${data.repo || html`<span class="text-muted">None</span>`}</dd>
          <dt>Logo</dt><dd>${data.logo ? html`<img src="${data.logo.dataUrl}" alt="Your team logo" width="48" height="48" class="rounded-m object-cover">` : html`<span class="text-muted">None</span>`}</dd>
        </dl>
      </div>`);
  }

  const initials = (name) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("") || "?";

  /* ---------- Moving between steps ---------- */

  function show(step, { focus = true } = {}) {
    const state = store.get();
    const done = step === "done";

    $$("[data-step]").forEach((section) => {
      section.hidden = section.dataset.step !== String(step);
    });

    $$("[data-step-marker]").forEach((marker) => {
      const n = Number(marker.dataset.stepMarker);
      marker.classList.toggle("is-done", done || n < step);
      if (n === step) marker.setAttribute("aria-current", "step");
      else marker.removeAttribute("aria-current");
    });

    const percent = done ? 100 : Math.round((step / STEPS) * 100);
    const progress = $("#progress");
    progress.style.setProperty("--value", `${percent}%`);
    progress.setAttribute("aria-valuenow", percent);
    progress.setAttribute("aria-valuetext", done ? "Registration complete" : `Step ${step} of ${STEPS}`);

    $("#wizard-nav").hidden = done;
    $('[data-action="back"]').hidden = step === 1;
    $('[data-action="next"]').hidden = step === STEPS;
    $('[type="submit"]').hidden = step !== STEPS;
    $('[data-action="next"]').innerHTML = state.returnToReview
      ? "Save and go to review"
      : `Next <i data-icon="arrow-right"></i>`;

    if (step === STEPS) renderReview(state.data);
    if (done) {
      const { data, reference } = state;
      $("#done-text").textContent = `${data.teamName} is in the ${data.track} track. We sent the schedule to all ${data.members.length} members. Your reference is ${reference}.`;
    }

    document.title = done ? "Registered | Spring Build Weekend" : `Step ${step} of ${STEPS} | Register your team`;
    if (focus) $(`[data-step="${step}"] h2`)?.focus();
  }

  function goTo(step, extra = {}) {
    store.set({ step, ...extra });
    show(step);
  }

  function next() {
    const { step, returnToReview } = store.get();
    if (!VWA.validate($(`[data-step="${step}"]`))) return;
    goTo(returnToReview ? STEPS : step + 1, { returnToReview: false });
  }

  function clearErrors() {
    $$("#wizard [aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    $$("#wizard .field-error").forEach((el) => {
      el.textContent = "";
    });
    $("#logo").setCustomValidity("");
  }

  function startOver() {
    store.reset();
    form.reset();
    clearErrors();
    fillForm(store.get().data);
    show(1);
  }

  /* ---------- Filling the form from saved answers ---------- */

  // Browsers only check minlength on text the user typed, not on text a script put back
  // after a reload, so a saved answer that is too short would slip through. This applies
  // the same rule to both, with the same wording as ui.js.
  function checkMinLength(field) {
    const min = Number(field.getAttribute("minlength"));
    if (!min) return;
    const length = field.value.length;
    const name = field.labels[0].textContent.replace(/\(optional\)/i, "").trim();
    field.setCustomValidity(length > 0 && length < min ? `${name} needs at least ${min} characters (now ${length}).` : "");
  }

  function updateCounter() {
    const length = $("#idea").value.length;
    $("#idea-count").textContent =
      length < 30 ? `${length} of 280 characters, ${30 - length} more to reach the minimum` : `${length} of 280 characters`;
  }

  function fillForm(data) {
    for (const key of FIELDS) form.elements[key].value = data[key] || "";
    renderMembers(data.members);
    renderLogo(data.logo);
    updateCounter();
    $$("[minlength]", form).forEach(checkMinLength);
  }

  const state = store.get();
  fillForm(state.data);
  show(state.done ? "done" : state.step, { focus: false });

  /* ---------- Events ---------- */

  // Save every answer as it is typed or picked
  on(form, "input", (event) => {
    const field = event.target;
    if (FIELDS.includes(field.name)) saveData({ [field.name]: field.value });
    if (field.dataset.member !== undefined) {
      const index = Number(field.dataset.member);
      saveData({
        members: store.get().data.members.map((member, i) => (i === index ? { ...member, [field.dataset.key]: field.value } : member)),
      });
    }
    if (field.id === "idea") updateCounter();
    if (field.hasAttribute("minlength")) checkMinLength(field);
  });

  on(form, "click", '[data-action="next"]', next);
  on(form, "click", '[data-action="back"]', () => goTo(store.get().step - 1, { returnToReview: false }));
  on(form, "click", "[data-goto]", (event, button) => goTo(Number(button.dataset.goto), { returnToReview: true }));

  on(form, "click", '[data-action="add-member"]', () => {
    saveData({ members: [...store.get().data.members, blankMember()] });
    renderMembers(store.get().data.members);
    $(`#member-${store.get().data.members.length - 1}-name`).focus();
  });

  on(form, "click", "[data-remove-member]", (event, button) => {
    const index = Number(button.dataset.removeMember);
    saveData({ members: store.get().data.members.filter((_, i) => i !== index) });
    renderMembers(store.get().data.members);
    // The removed row's button is gone; the row that took its place (or the last one) gets focus
    const members = store.get().data.members;
    $(`#member-${Math.min(index, members.length - 1)}-name`).focus();
  });

  // Enter in a text field moves to the next step instead of submitting the whole form
  on(form, "keydown", "input", (event, input) => {
    if (event.key !== "Enter" || ["checkbox", "radio", "file"].includes(input.type)) return;
    if (store.get().step === STEPS) return;
    event.preventDefault();
    next();
  });

  on("#logo", "change", (event) => handleFile(event.target.files[0]));

  // Drag and drop onto the drop zone
  const dropzone = $("#dropzone");
  ["dragenter", "dragover"].forEach((type) =>
    on(dropzone, type, (event) => {
      event.preventDefault();
      dropzone.classList.add("is-dragover");
    })
  );
  ["dragleave", "drop"].forEach((type) => on(dropzone, type, () => dropzone.classList.remove("is-dragover")));
  on(dropzone, "drop", (event) => {
    event.preventDefault();
    handleFile(event.dataTransfer.files[0]);
  });

  on(form, "click", '[data-action="remove-logo"]', () => {
    saveData({ logo: null });
    $("#logo").value = "";
    $("#logo").setCustomValidity("");
    renderLogo(null);
    $("#logo").focus();
  });

  // ui.js only lets the submit through when every field is valid
  on(form, "submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    button.setAttribute("aria-busy", "true");
    await sleep(800); // a real app would send the data with VWA.http.post here
    button.removeAttribute("aria-busy");
    const reference = `SBW-${String(Math.floor(1000 + Math.random() * 9000))}`;
    goTo("done", { done: true, reference });
  });

  on('[data-action="start-over"]', "click", async () => {
    const ok = await confirm("Everything you entered is deleted from this browser.", {
      title: "Start over?",
      confirmText: "Start over",
      danger: true,
    });
    if (ok) startOver();
  });

  on(form, "click", '[data-action="start-over-now"]', startOver);
})();

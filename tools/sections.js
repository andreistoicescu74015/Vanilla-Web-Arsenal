/*
  Page sections used by tools/page-builder.html (and the source of templates/landing.html).
  Each section is plain HTML built only from arsenal classes. Copy one straight into
  any page, or pick and order several in the page builder.

  region: "header" goes before <main>, "footer" after it, everything else inside <main>.

  Links: sign-up buttons point at auth.html#signup, the sign-up form in templates/auth.html,
  and the footer's Blog link points at article.html. Both exist next to the generated landing
  page in templates/; in your own project, change them to your real pages. Links such as
  #features, #pricing and #contact only work when the page also has that section.

  Design rule followed here: the brand gradient appears once per page, on the hero (one
  word of the headline and the main button). Every other section uses solid colors.
*/
window.VWA_SECTIONS = [
  {
    id: "navbar",
    name: "Navbar",
    group: "Navigation",
    region: "header",
    html: `
<header class="navbar">
  <div class="container navbar-inner">
    <a class="navbar-brand" href="#"><i data-icon="cloud" class="text-brand"></i> Nimbus</a>
    <nav class="navbar-links" id="main-nav" aria-label="Main">
      <a href="#features">Features</a>
      <a href="#how">How it works</a>
      <a href="#pricing">Pricing</a>
      <a href="#faq">FAQ</a>
    </nav>
    <div class="navbar-actions">
      <button class="btn btn-ghost btn-icon" type="button" data-theme-toggle></button>
      <a class="btn btn-primary btn-sm" href="auth.html#signup">Get started</a>
      <button class="btn btn-ghost btn-icon navbar-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="main-nav" aria-label="Menu"><i data-icon="menu"></i></button>
    </div>
  </div>
</header>`,
  },

  {
    id: "hero-centered",
    name: "Hero, centered with app preview",
    group: "Hero",
    html: `
<section class="hero bg-aurora">
  <div class="container stack items-center gap-l">
    <a class="eyebrow no-underline animate-fade-down" href="#features"><i data-icon="sparkles"></i> New: shared calendars for teams</a>
    <h1 class="max-w-l animate-fade-up">Plan projects with your team, <span class="gradient-text">not around it</span></h1>
    <p class="lead animate-fade-up" style="--delay: 100ms">Nimbus keeps tasks, deadlines and files on one board, so student teams ship on time without a single group-chat meltdown.</p>
    <div class="cluster animate-fade-up" style="--delay: 200ms; --justify: center">
      <a class="btn btn-gradient btn-lg" href="auth.html#signup">Start for free <i data-icon="arrow-right"></i></a>
      <a class="btn btn-outline btn-lg" href="#how">See how it works</a>
    </div>
    <div class="cluster text-sm text-muted animate-fade-up" style="--delay: 300ms; --justify: center">
      <div class="avatar-group" style="--size: 2rem">
        <span class="avatar">AP</span>
        <span class="avatar">MI</span>
        <span class="avatar">ED</span>
        <span class="avatar">AS</span>
      </div>
      <span><strong>4.9 out of 5</strong> from 2,000+ student teams</span>
    </div>
    <div class="mock-window w-full mt-xl animate-zoom-in" style="--delay: 400ms" aria-hidden="true">
      <div class="mock-window-bar"><span></span><span></span><span></span></div>
      <div class="mock-window-body">
        <!-- Three columns on wide screens; on phones the columns scroll sideways -->
        <div class="reel" tabindex="-1" style="--item-width: max(16rem, (100% - 2 * var(--space-m)) / 3)">
          <div class="stack gap-s">
            <div class="split"><strong class="text-sm">To do</strong><span class="badge">3</span></div>
            <div class="card"><div class="card-body p-m gap-xs"><span class="text-sm font-semibold">Interview 5 students</span><span class="badge badge-info">Research</span></div></div>
            <div class="card"><div class="card-body p-m gap-xs"><span class="text-sm font-semibold">Pick a color palette</span><span class="badge badge-primary">Design</span></div></div>
          </div>
          <div class="stack gap-s">
            <div class="split"><strong class="text-sm">In progress</strong><span class="badge">2</span></div>
            <div class="card card-featured"><div class="card-body p-m gap-xs"><span class="text-sm font-semibold">Build the landing page</span><div class="progress"><span style="--value: 70%"></span></div></div></div>
            <div class="card"><div class="card-body p-m gap-xs"><span class="text-sm font-semibold">Connect the API</span><span class="badge badge-warning">Blocked</span></div></div>
          </div>
          <div class="stack gap-s">
            <div class="split"><strong class="text-sm">Done</strong><span class="badge">8</span></div>
            <div class="card"><div class="card-body p-m gap-xs"><span class="text-sm font-semibold text-muted">Set up the repo</span><span class="badge badge-success"><i data-icon="check"></i> Done</span></div></div>
            <div class="card"><div class="card-body p-m gap-xs"><span class="text-sm font-semibold text-muted">Choose a name</span><span class="badge badge-success"><i data-icon="check"></i> Done</span></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },

  {
    id: "hero-split",
    name: "Hero, text and image side by side",
    group: "Hero",
    html: `
<section class="section bg-grid">
  <div class="container cols-2 items-center" style="--gap: var(--space-3xl)">
    <div class="stack gap-l">
      <span class="eyebrow"><i data-icon="zap"></i> Built for hackathons</span>
      <h1>Ship the demo, <span class="gradient-text">skip the chaos</span></h1>
      <p class="lead">One board for tasks, files and deadlines. Set it up in two minutes and spend the rest of the weekend building.</p>
      <div class="cluster">
        <a class="btn btn-gradient btn-lg" href="auth.html#signup">Get started</a>
        <a class="btn btn-ghost btn-lg" href="#features">Learn more <i data-icon="arrow-right"></i></a>
      </div>
      <ul role="list" class="cluster text-sm text-muted" style="--gap: var(--space-l)">
        <li class="flex items-center gap-xs"><i data-icon="check" class="text-success"></i> Free for teams up to 5</li>
        <li class="flex items-center gap-xs"><i data-icon="check" class="text-success"></i> No credit card</li>
      </ul>
    </div>
    <div class="relative">
      <img class="rounded-l shadow-l w-full" data-placeholder="Your product screenshot" width="1200" height="900" alt="The Nimbus board with three columns of tasks">
      <div class="card glass absolute animate-float hide-mobile" style="inset: auto auto -1.5rem -1.5rem">
        <div class="card-body flex-row items-center p-m">
          <div class="icon-box"><i data-icon="trending-up"></i></div>
          <div class="stat"><span class="stat-label">Tasks done this week</span><span class="text-xl font-bold">+38%</span></div>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },

  {
    id: "logos",
    name: "Logo strip (marquee)",
    group: "Social proof",
    html: `
<section class="py-2xl border-b">
  <div class="container stack gap-l">
    <p class="text-sm text-muted text-center">Used by student teams at 120+ universities</p>
    <div class="marquee" data-marquee>
      <div class="marquee-track" style="--speed: 35s">
        <span class="flex items-center gap-xs text-xl font-bold text-muted"><i data-icon="globe"></i> Northfield</span>
        <span class="flex items-center gap-xs text-xl font-bold text-muted"><i data-icon="book-open"></i> Bluehill University</span>
        <span class="flex items-center gap-xs text-xl font-bold text-muted"><i data-icon="target"></i> Carpathia Tech</span>
        <span class="flex items-center gap-xs text-xl font-bold text-muted"><i data-icon="award"></i> Danube Institute</span>
        <span class="flex items-center gap-xs text-xl font-bold text-muted"><i data-icon="layers"></i> Westbridge</span>
        <span class="flex items-center gap-xs text-xl font-bold text-muted"><i data-icon="sparkles"></i> Lumen College</span>
      </div>
    </div>
  </div>
</section>`,
  },

  {
    id: "features",
    name: "Feature grid (bento)",
    group: "Content",
    html: `
<section class="section" id="features">
  <div class="container">
    <div class="section-header">
      <h2>Everything a team needs, nothing it does not</h2>
      <p class="lead">Six tools that replace the spreadsheet, the group chat and the shared folder nobody can find.</p>
    </div>
    <!-- Bento grid: two wide tiles with a small visual, four regular ones -->
    <div class="cols-4" data-reveal-group>
      <article class="card span-2" data-reveal>
        <div class="card-body gap-m">
          <div class="flex items-center gap-s"><div class="icon-box"><i data-icon="layers"></i></div><h3 class="text-xl">Boards</h3></div>
          <p class="text-muted">Drag tasks between columns and see who is working on what at a glance.</p>
          <div class="flex gap-xs mt-xs" aria-hidden="true">
            <div class="stack flex-1 min-w-0 p-xs rounded-m gap-xs" style="background: var(--surface-2)">
              <span class="text-xs font-semibold text-muted">To do</span>
              <span class="p-xs rounded-s border text-xs truncate" style="background: var(--bg)">Interview users</span>
              <span class="p-xs rounded-s border text-xs truncate" style="background: var(--bg)">Pick colors</span>
            </div>
            <div class="stack flex-1 min-w-0 p-xs rounded-m gap-xs" style="background: var(--surface-2)">
              <span class="text-xs font-semibold text-muted">Doing</span>
              <span class="p-xs rounded-s text-xs truncate" style="background: var(--bg); border: 1px solid var(--primary)">Landing page</span>
            </div>
            <div class="stack flex-1 min-w-0 p-xs rounded-m gap-xs" style="background: var(--surface-2)">
              <span class="text-xs font-semibold text-muted">Done</span>
              <span class="p-xs rounded-s border text-xs text-muted truncate" style="background: var(--bg)">Repo set up</span>
              <span class="p-xs rounded-s border text-xs text-muted truncate" style="background: var(--bg)">Name chosen</span>
            </div>
          </div>
        </div>
      </article>
      <article class="card" data-reveal>
        <div class="card-body">
          <div class="icon-box"><i data-icon="calendar"></i></div>
          <h3 class="text-lg">Shared calendar</h3>
          <p class="text-muted">Deadlines from every board in one calendar, synced to your phone.</p>
        </div>
      </article>
      <article class="card" data-reveal>
        <div class="card-body">
          <div class="icon-box"><i data-icon="message-circle"></i></div>
          <h3 class="text-lg">Comments on tasks</h3>
          <p class="text-muted">Discuss the work where the work is, not in an hour of chat history.</p>
        </div>
      </article>
      <article class="card" data-reveal>
        <div class="card-body">
          <div class="icon-box"><i data-icon="folder"></i></div>
          <h3 class="text-lg">Files in context</h3>
          <p class="text-muted">Attach designs and documents to the task they belong to.</p>
        </div>
      </article>
      <article class="card" data-reveal>
        <div class="card-body">
          <div class="icon-box"><i data-icon="bell"></i></div>
          <h3 class="text-lg">Smart reminders</h3>
          <p class="text-muted">A nudge the day before a deadline, and silence the rest of the time.</p>
        </div>
      </article>
      <article class="card span-2" data-reveal>
        <div class="card-body gap-m">
          <div class="flex items-center gap-s"><div class="icon-box"><i data-icon="bar-chart"></i></div><h3 class="text-xl">Progress reports</h3></div>
          <p class="text-muted">A weekly chart your teacher or mentor can open without an account.</p>
          <div class="split items-end gap-l mt-xs" aria-hidden="true">
            <div class="flex items-end gap-xs grow" style="height: 5.5rem">
              <span class="flex-1 rounded-s" style="height: 35%; background: var(--primary)"></span>
              <span class="flex-1 rounded-s" style="height: 55%; background: var(--primary)"></span>
              <span class="flex-1 rounded-s" style="height: 45%; background: var(--primary)"></span>
              <span class="flex-1 rounded-s" style="height: 70%; background: var(--primary)"></span>
              <span class="flex-1 rounded-s" style="height: 60%; background: var(--primary)"></span>
              <span class="flex-1 rounded-s" style="height: 100%; background: var(--accent)"></span>
            </div>
            <div class="stat"><span class="stat-value text-brand">+24%</span><span class="stat-label">tasks done this week</span></div>
          </div>
        </div>
      </article>
    </div>
  </div>
</section>`,
  },

  {
    id: "feature-split",
    name: "Feature with chart and checklist",
    group: "Content",
    html: `
<section class="section bg-surface">
  <div class="container cols-2 items-center" style="--gap: var(--space-3xl)" data-reveal-group>
    <div class="mock-window" data-reveal aria-hidden="true">
      <div class="mock-window-bar"><span></span><span></span><span></span></div>
      <div class="mock-window-body stack">
        <div class="split"><strong>Tasks completed</strong><span class="badge badge-success">+24%</span></div>
        <div class="flex items-end gap-s" style="height: 11rem">
          <div class="grow rounded-s" style="height: 35%; background: var(--primary)"></div>
          <div class="grow rounded-s" style="height: 55%; background: var(--primary)"></div>
          <div class="grow rounded-s" style="height: 45%; background: var(--primary)"></div>
          <div class="grow rounded-s" style="height: 70%; background: var(--primary)"></div>
          <div class="grow rounded-s" style="height: 60%; background: var(--primary)"></div>
          <div class="grow rounded-s" style="height: 85%; background: var(--primary)"></div>
          <div class="grow rounded-s" style="height: 100%; background: var(--accent)"></div>
        </div>
        <div class="split text-xs text-muted"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
      </div>
    </div>
    <div class="stack gap-l" data-reveal>
      <h2>Know where the project stands before the mentor asks</h2>
      <p class="text-muted">Nimbus turns finished tasks into a chart you can drop straight into the final presentation.</p>
      <ul role="list" class="stack gap-s">
        <li class="flex gap-s"><i data-icon="check-circle" class="text-success"></i> Weekly progress per person and per board</li>
        <li class="flex gap-s"><i data-icon="check-circle" class="text-success"></i> Export as image or CSV</li>
        <li class="flex gap-s"><i data-icon="check-circle" class="text-success"></i> Share a read-only link</li>
      </ul>
      <a class="btn btn-outline self-start" href="#features">See all features <i data-icon="arrow-right"></i></a>
    </div>
  </div>
</section>`,
  },

  {
    id: "steps",
    name: "How it works (3 steps)",
    group: "Content",
    html: `
<section class="section" id="how">
  <div class="container">
    <div class="section-header section-header-start">
      <h2>From idea to demo in three steps</h2>
      <p class="lead">No setup meeting, no onboarding call.</p>
    </div>
    <ol role="list" class="cols-3" style="--gap: var(--space-2xl)" data-reveal-group>
      <li class="stack" data-reveal>
        <span class="step-number">1</span>
        <h3 class="text-xl">Create a board</h3>
        <p class="text-muted">Start from a hackathon template with columns for research, design, build and pitch.</p>
      </li>
      <li class="stack" data-reveal>
        <span class="step-number">2</span>
        <h3 class="text-xl">Invite the team</h3>
        <p class="text-muted">Share one link. Everyone joins with their university email, no setup.</p>
      </li>
      <li class="stack" data-reveal>
        <span class="step-number">3</span>
        <h3 class="text-xl">Ship and present</h3>
        <p class="text-muted">Track progress until the deadline, then export the report for your pitch.</p>
      </li>
    </ol>
  </div>
</section>`,
  },

  {
    id: "stats",
    name: "Stats band (count up)",
    group: "Social proof",
    html: `
<section class="py-3xl border-t border-b">
  <div class="container auto-grid text-center" style="--min: 9rem">
    <div class="stat"><span class="stat-value text-brand" data-count-to="2000" data-suffix="+">2,000+</span><span class="stat-label">student teams</span></div>
    <div class="stat"><span class="stat-value text-brand" data-count-to="48000">48,000</span><span class="stat-label">tasks finished</span></div>
    <div class="stat"><span class="stat-value text-brand" data-count-to="120">120</span><span class="stat-label">universities</span></div>
    <div class="stat"><span class="stat-value text-brand" data-count-to="4.9" data-suffix="/5">4.9/5</span><span class="stat-label">average rating</span></div>
  </div>
</section>`,
  },

  {
    id: "testimonials",
    name: "Testimonials",
    group: "Social proof",
    html: `
<section class="section bg-surface">
  <div class="container">
    <div class="section-header section-header-start">
      <h2>Teams that shipped with Nimbus</h2>
    </div>
    <div class="auto-grid" style="--min: 18rem" data-reveal-group>
      <figure class="card m-0" data-reveal>
        <div class="card-body gap-m">
          <span class="rating" role="img" aria-label="5 out of 5 stars"><i data-icon="star" class="is-filled"></i><i data-icon="star" class="is-filled"></i><i data-icon="star" class="is-filled"></i><i data-icon="star" class="is-filled"></i><i data-icon="star" class="is-filled"></i></span>
          <blockquote><p>"We stopped losing tasks in the chat. Our demo was the only one that worked on the first try."</p></blockquote>
          <figcaption class="flex items-center gap-s push-down">
            <span class="avatar">AP</span>
            <span><strong class="block">Ana Popescu</strong><span class="text-sm text-muted">Team lead, Pixel Pushers</span></span>
          </figcaption>
        </div>
      </figure>
      <figure class="card m-0" data-reveal>
        <div class="card-body gap-m">
          <span class="rating" role="img" aria-label="5 out of 5 stars"><i data-icon="star" class="is-filled"></i><i data-icon="star" class="is-filled"></i><i data-icon="star" class="is-filled"></i><i data-icon="star" class="is-filled"></i><i data-icon="star" class="is-filled"></i></span>
          <blockquote><p>"The weekly report went straight into our pitch deck. The jury asked which tool we used."</p></blockquote>
          <figcaption class="flex items-center gap-s push-down">
            <span class="avatar">MI</span>
            <span><strong class="block">Mihai Ionescu</strong><span class="text-sm text-muted">Developer, Null Byte</span></span>
          </figcaption>
        </div>
      </figure>
      <figure class="card m-0" data-reveal>
        <div class="card-body gap-m">
          <span class="rating" role="img" aria-label="4 out of 5 stars"><i data-icon="star" class="is-filled"></i><i data-icon="star" class="is-filled"></i><i data-icon="star" class="is-filled"></i><i data-icon="star" class="is-filled"></i><i data-icon="star"></i></span>
          <blockquote><p>"Setting up took two minutes. Our mentor followed progress without joining another app."</p></blockquote>
          <figcaption class="flex items-center gap-s push-down">
            <span class="avatar">ED</span>
            <span><strong class="block">Elena Dumitru</strong><span class="text-sm text-muted">Product manager, Flexperts</span></span>
          </figcaption>
        </div>
      </figure>
    </div>
  </div>
</section>`,
  },

  {
    id: "pricing",
    name: "Pricing (3 tiers)",
    group: "Pricing",
    html: `
<section class="section" id="pricing">
  <div class="container">
    <div class="section-header">
      <h2>Free while you study</h2>
      <p class="lead">Pay only when your project turns into a company.</p>
    </div>
    <div class="auto-grid" style="--min: 17rem" data-reveal-group>
      <article class="card" data-reveal>
        <div class="card-body gap-l">
          <div class="stack gap-xs"><h3 class="text-lg">Student</h3><p class="text-muted">For one team and one project.</p></div>
          <p><span class="text-4xl font-bold">€0</span> <span class="text-muted">forever</span></p>
          <ul role="list" class="stack gap-s">
            <li class="flex gap-xs"><i data-icon="check" class="text-success"></i> Up to 5 members</li>
            <li class="flex gap-xs"><i data-icon="check" class="text-success"></i> 3 boards</li>
            <li class="flex gap-xs"><i data-icon="check" class="text-success"></i> 1 GB of files</li>
          </ul>
          <a class="btn btn-outline btn-block push-down" href="auth.html#signup">Start free</a>
        </div>
      </article>
      <article class="card card-featured" data-reveal>
        <div class="card-body gap-l">
          <div class="stack gap-xs"><div class="split"><h3 class="text-lg">Team</h3><span class="badge badge-solid">Most popular</span></div><p class="text-muted">For clubs and growing projects.</p></div>
          <p><span class="text-4xl font-bold">€6</span> <span class="text-muted">per member / month</span></p>
          <ul role="list" class="stack gap-s">
            <li class="flex gap-xs"><i data-icon="check" class="text-success"></i> Unlimited members</li>
            <li class="flex gap-xs"><i data-icon="check" class="text-success"></i> Unlimited boards</li>
            <li class="flex gap-xs"><i data-icon="check" class="text-success"></i> Reports and exports</li>
            <li class="flex gap-xs"><i data-icon="check" class="text-success"></i> 50 GB of files</li>
          </ul>
          <a class="btn btn-primary btn-block push-down" href="auth.html#signup">Try it for 30 days</a>
        </div>
      </article>
      <article class="card" data-reveal>
        <div class="card-body gap-l">
          <div class="stack gap-xs"><h3 class="text-lg">University</h3><p class="text-muted">For faculties and hackathon organizers.</p></div>
          <p><span class="text-2xl font-bold">Custom pricing</span></p>
          <ul role="list" class="stack gap-s">
            <li class="flex gap-xs"><i data-icon="check" class="text-success"></i> Single sign-on</li>
            <li class="flex gap-xs"><i data-icon="check" class="text-success"></i> Judging dashboard</li>
            <li class="flex gap-xs"><i data-icon="check" class="text-success"></i> Priority support</li>
          </ul>
          <a class="btn btn-outline btn-block push-down" href="#contact">Contact sales</a>
        </div>
      </article>
    </div>
  </div>
</section>`,
  },

  {
    id: "faq",
    name: "FAQ (accordion)",
    group: "Content",
    html: `
<section class="section bg-surface" id="faq">
  <div class="container with-sidebar" style="--sidebar-width: 18rem; --gap: var(--space-3xl)">
    <div class="stack gap-s">
      <h2>Questions, answered</h2>
      <p class="text-muted">Something else? <a href="#contact">Write to us</a> and a person replies within a day.</p>
    </div>
    <div>
      <details class="accordion" name="faq" open>
        <summary>Is Nimbus really free for students?</summary>
        <div class="accordion-content"><p>Yes. The Student plan has no time limit. You only pay if you need more than 5 members or 3 boards.</p></div>
      </details>
      <details class="accordion" name="faq">
        <summary>Can our mentor see the board without an account?</summary>
        <div class="accordion-content"><p>Yes. Share a read-only link from the board menu. You can turn it off at any time.</p></div>
      </details>
      <details class="accordion" name="faq">
        <summary>Does it work on phones?</summary>
        <div class="accordion-content"><p>Nimbus works in any modern mobile browser, and you can add it to your home screen.</p></div>
      </details>
      <details class="accordion" name="faq">
        <summary>What happens to our data after the hackathon?</summary>
        <div class="accordion-content"><p>It stays until you delete it. Export everything as CSV whenever you want.</p></div>
      </details>
    </div>
  </div>
</section>`,
  },

  {
    id: "cta",
    name: "Call to action band",
    group: "Content",
    html: `
<section class="section">
  <div class="container">
    <div class="bg-primary rounded-l p-2xl text-center stack items-center gap-l shadow-l" data-reveal="zoom">
      <h2>Ready to ship your next project?</h2>
      <p class="lead">Set up your board in two minutes. Free for student teams, forever.</p>
      <div class="cluster" style="--justify: center">
        <a class="btn btn-light btn-lg" href="auth.html#signup">Start for free</a>
        <a class="btn btn-outline-light btn-lg" href="#contact">Talk to us</a>
      </div>
    </div>
  </div>
</section>`,
  },

  {
    id: "newsletter",
    name: "Newsletter signup",
    group: "Forms",
    html: `
<section class="section">
  <div class="container">
    <div class="card">
      <div class="card-body p-xl">
        <div class="split gap-l">
          <div class="stack gap-xs">
            <h2 class="text-2xl">One useful email a month</h2>
            <p class="text-muted">Tips for student teams. No spam, unsubscribe with one click.</p>
          </div>
          <form class="input-group w-full max-w-m" onsubmit="event.preventDefault(); VWA.toast('Thanks! Check your inbox.', { type: 'success' }); this.reset();">
            <label class="visually-hidden" for="newsletter-email">Email address</label>
            <input class="input" id="newsletter-email" type="email" autocomplete="email" placeholder="you@example.com" required>
            <button class="btn btn-primary" type="submit">Subscribe</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },

  {
    id: "contact",
    name: "Contact form",
    group: "Forms",
    html: `
<section class="section" id="contact">
  <div class="container cols-2" style="--gap: var(--space-3xl)">
    <div class="stack gap-l">
      <h2>Talk to a person</h2>
      <p class="text-muted">Questions about plans, a hackathon partnership, or a bug? We read every message.</p>
      <ul role="list" class="stack gap-m">
        <li class="flex items-center gap-s"><div class="icon-box"><i data-icon="mail"></i></div><span><strong class="block">Email</strong><a href="mailto:hello@example.com">hello@example.com</a></span></li>
        <li class="flex items-center gap-s"><div class="icon-box"><i data-icon="map-pin"></i></div><span><strong class="block">Office</strong><span class="text-muted">Bucharest, Romania</span></span></li>
        <li class="flex items-center gap-s"><div class="icon-box"><i data-icon="clock"></i></div><span><strong class="block">Reply time</strong><span class="text-muted">Within one working day</span></span></li>
      </ul>
    </div>
    <form class="card" data-validate onsubmit="event.preventDefault(); VWA.toast('Message sent. We will reply soon.', { type: 'success' }); this.reset();">
      <div class="card-body gap-m">
        <div class="field">
          <label class="label" for="contact-name">Name</label>
          <input class="input" id="contact-name" name="name" autocomplete="name" required>
        </div>
        <div class="field">
          <label class="label" for="contact-email">Email</label>
          <input class="input" id="contact-email" name="email" type="email" autocomplete="email" required>
        </div>
        <div class="field">
          <label class="label" for="contact-message">Message</label>
          <textarea class="input" id="contact-message" name="message" minlength="10" required></textarea>
        </div>
        <button class="btn btn-primary" type="submit"><i data-icon="send"></i> Send message</button>
      </div>
    </form>
  </div>
</section>`,
  },

  {
    id: "team",
    name: "Team",
    group: "Content",
    html: `
<section class="section">
  <div class="container">
    <div class="section-header">
      <h2>The people behind it</h2>
    </div>
    <div class="auto-grid" style="--min: 12rem" data-reveal-group>
      <div class="stack items-center text-center gap-xs" data-reveal><span class="avatar" style="--size: 5rem">AP</span><strong>Ana Popescu</strong><span class="text-sm text-muted">Design</span></div>
      <div class="stack items-center text-center gap-xs" data-reveal><span class="avatar" style="--size: 5rem">MI</span><strong>Mihai Ionescu</strong><span class="text-sm text-muted">Frontend</span></div>
      <div class="stack items-center text-center gap-xs" data-reveal><span class="avatar" style="--size: 5rem">AS</span><strong>Andrei Stan</strong><span class="text-sm text-muted">Backend</span></div>
      <div class="stack items-center text-center gap-xs" data-reveal><span class="avatar" style="--size: 5rem">IM</span><strong>Ioana Marin</strong><span class="text-sm text-muted">Data</span></div>
    </div>
  </div>
</section>`,
  },

  {
    id: "blog",
    name: "Blog post cards",
    group: "Content",
    html: `
<section class="section">
  <div class="container">
    <div class="split mb-2xl">
      <h2>From the blog</h2>
      <a class="btn btn-ghost" href="article.html">All posts <i data-icon="arrow-right"></i></a>
    </div>
    <div class="auto-grid" style="--min: 18rem" data-reveal-group>
      <article class="card card-interactive" data-reveal>
        <img class="card-media" data-placeholder="Flexbox" data-hue="200" width="800" height="450" alt="">
        <div class="card-body">
          <span class="badge badge-primary">CSS</span>
          <h3 class="text-lg"><a class="card-link" href="article.html">Flexbox in ten minutes</a></h3>
          <p class="text-muted line-clamp-2">The two axes, the five properties you use every day, and the one-line fix for overflowing children.</p>
        </div>
        <div class="card-footer text-sm text-muted"><span class="avatar" style="--size: 1.5rem">AP</span> Ana Popescu, Sep 12</div>
      </article>
      <article class="card card-interactive" data-reveal>
        <img class="card-media" data-placeholder="Empty states" data-hue="30" width="800" height="450" alt="">
        <div class="card-body">
          <span class="badge badge-info">UX</span>
          <h3 class="text-lg"><a class="card-link" href="article.html">Designing empty states that help</a></h3>
          <p class="text-muted line-clamp-2">An empty screen is a chance to explain what the page is for and what to do first.</p>
        </div>
        <div class="card-footer text-sm text-muted"><span class="avatar" style="--size: 1.5rem">ED</span> Elena Dumitru, Aug 30</div>
      </article>
      <article class="card card-interactive" data-reveal>
        <img class="card-media" data-placeholder="Contrast" data-hue="150" width="800" height="450" alt="">
        <div class="card-body">
          <span class="badge badge-success">Accessibility</span>
          <h3 class="text-lg"><a class="card-link" href="article.html">Color contrast without guesswork</a></h3>
          <p class="text-muted line-clamp-2">What 4.5:1 means, how to measure it, and how to fix a brand color that fails.</p>
        </div>
        <div class="card-footer text-sm text-muted"><span class="avatar" style="--size: 1.5rem">IM</span> Ioana Marin, Jul 18</div>
      </article>
    </div>
  </div>
</section>`,
  },

  {
    id: "footer",
    name: "Footer with columns",
    group: "Navigation",
    region: "footer",
    html: `
<footer class="footer">
  <div class="container stack gap-2xl">
    <div class="cols-4">
      <div class="stack gap-s">
        <a class="navbar-brand" href="#"><i data-icon="cloud" class="text-brand"></i> Nimbus</a>
        <p>Project boards for student teams.</p>
        <div class="cluster">
          <a class="btn btn-ghost btn-icon btn-sm" href="mailto:hello@example.com" aria-label="Email"><i data-icon="mail"></i></a>
          <a class="btn btn-ghost btn-icon btn-sm" href="article.html" aria-label="Blog"><i data-icon="book-open"></i></a>
          <a class="btn btn-ghost btn-icon btn-sm" href="#" aria-label="Community"><i data-icon="users"></i></a>
        </div>
      </div>
      <nav class="stack gap-xs" aria-label="Product">
        <p class="footer-title">Product</p>
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
      </nav>
      <nav class="stack gap-xs" aria-label="Company">
        <p class="footer-title">Company</p>
        <a href="#">About</a>
        <a href="article.html">Blog</a>
        <a href="mailto:hello@example.com">Contact</a>
      </nav>
      <nav class="stack gap-xs" aria-label="Legal">
        <p class="footer-title">Legal</p>
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
        <a href="#">Cookies</a>
      </nav>
    </div>
    <div class="split border-t pt-l">
      <p>&copy; 2026 Nimbus. Made at a hackathon.</p>
      <p>Built with HTML, CSS and JavaScript.</p>
    </div>
  </div>
</footer>`,
  },
];

// ─────────────────────────────────────────────────────────────
// Everything the site shows lives here.
//
// notes[] is one feed: kind 'learned' | 'built' | 'wrote'.
//   learned / built  → short notes, shown in full in the feed (no blocks needed)
//   wrote            → essays; open in the reader. source:'medium' + url shows "Continue on Medium ↗"
// Block types (essays + case studies):
//   {t:'p',text} {t:'h2',text} {t:'quote',text} {t:'list',items:[]}
//   {t:'steps',items:[{n,title,text}]} {t:'code',file,lang,text}
//   {t:'figure',label,caption,h} {t:'metrics',items:[{n,l}]}
// ─────────────────────────────────────────────────────────────
export default {
  profile: {
    name: 'Aayush Kumar',
    headline: 'Product, AI, and whatever I’m building this weekend.',
    bio: 'A PM who builds: three B2B SaaS platforms at ZIGRAM by day, side projects by weekend. I learn in public, ship what I learn, and write it down.',
    city: 'New Delhi',
    tz: 'Asia/Kolkata',
    email: 'aayushkr117@gmail.com',
    links: [
      { label: 'Email', url: 'mailto:aayushkr117@gmail.com' },
      { label: 'LinkedIn ↗', url: 'https://www.linkedin.com/' },
      { label: 'GitHub ↗', url: 'https://github.com/' },
      { label: 'Medium ↗', url: 'https://medium.com/' }
    ],
    building: { label: 'DPDP Shield', url: 'https://dpdpshield.netlify.app' },
    resumePdf: 'assets/Aayush_Kumar_Resume.pdf'
  },

  experience: [
    {
      org: 'ZIGRAM', kind: 'B2B RegTech & AI SaaS', role: 'Senior Analyst, Product Management', period: 'Jan 2025 — Present', place: 'India',
      summary: 'Own strategy, requirements and delivery across three platforms with a cross-functional team.',
      products: ['transact-comply', 'profile-builder', 'privacy-panda']
    }
  ],
  education: { school: 'GGSIPU, New Delhi', degree: 'B.Tech, Information Technology', period: '2021 — 2025', note: 'CGPA 9.08 / 10' },
  skills: [
    { group: 'AI', items: 'LLM apps, agentic workflows, RAG, prompt & context engineering, evals & guardrails, MCP, Claude Code' },
    { group: 'Product', items: 'Strategy, discovery, research, PRD / FRD, roadmapping, 0 → 1, GTM, KPIs' },
    { group: 'Delivery', items: 'Agile / Scrum, release management, UAT, JIRA, stakeholder management' },
    { group: 'Technical', items: 'Python, SQL, REST APIs, Postman, PostHog, Git, CI/CD' },
    { group: 'Domain', items: 'RegTech, AML / CFT, KYC, fraud, sanctions & PEP, entity resolution, DPDP Act 2023' }
  ],

  // Case studies. Experience lists them minimally; the detail lives here.
  projects: [
    {
      slug: 'transact-comply', title: 'Transact Comply', what: 'AI transaction monitoring', sector: 'RegTech · AML', year: '2025 — now',
      line: 'A GenAI workflow that turns regulatory scenarios into tested production rules.',
      key: { n: '1 → 20+', l: 'clients in 2 months' },
      dek: 'Every new client waited a month for hand-written detection rules before their first alert.',
      role: 'Product manager and builder', tools: 'Claude Code, YAML DSL, Python',
      tags: ['Generative AI', 'Guardrails', 'Rules engine'],
      blocks: [
        { t: 'figure', label: 'Hero diagram · system overview', caption: 'SFTP ingestion → identity resolution → rules engine → alerts.', h: 300 },
        { t: 'h2', text: 'A month of configuration before the first alert' },
        { t: 'p', text: 'Transaction monitoring is only as good as its rules. For every new client — a bank, an NBFC, a crypto exchange — our implementation team translated regulatory typologies into detection logic by hand, then wrote test data to prove each rule fired when it should and stayed quiet when it shouldn’t.' },
        { t: 'p', text: 'That took about a month per client. Sales could close faster than we could configure, so the ceiling on growth wasn’t demand. It was how many rules a small team could write and verify.' },
        { t: 'h2', text: 'A workflow that writes rules, and a system that doesn’t trust it' },
        { t: 'p', text: 'I designed and built a generative AI workflow in Claude Code that takes a regulatory scenario in plain language and produces a production rule in our YAML DSL, positive, negative and edge-case test data, and a deployment package. A Source of Truth layer runs a similarity search first, so we extend coverage instead of duplicating it.' },
        { t: 'steps', items: [
          { n: '01', title: 'Retrieve', text: 'Similarity search over the existing library. A match means reuse, not regenerate.' },
          { n: '02', title: 'Generate', text: 'The LLM drafts the rule and its test data.' },
          { n: '03', title: 'Validate', text: 'Schema, golden regression, generated tests. Fail any one and it goes back to 02.' },
          { n: '04', title: 'Deploy', text: 'Production, with an audit trail.' }
        ] },
        { t: 'quote', text: 'The model was never the risky part. The risk was a plausible-looking rule that silently missed a typology.' },
        { t: 'h2', text: 'From one client to twenty in two months' },
        { t: 'metrics', items: [{ n: '1→20+', l: 'clients in 2 mo' }, { n: '<48h', l: 'config, was 1 mo' }, { n: '500+', l: 'prod rules' }, { n: '−50%', l: 'inference cost' }, { n: '+10%', l: 'detection coverage' }, { n: '40+', l: 'file formats' }] },
        { t: 'p', text: 'Pre-sales could promise coverage and implementation could keep the promise, across banking, NBFC, insurance, housing finance, crypto and payments in India, the UK and Nepal. Sales now uses the Source of Truth in live demos.' },
        { t: 'h2', text: 'What I’d do differently' },
        { t: 'p', text: 'I built the golden regression suite after the first hundred rules, not before. Next time the evaluation harness ships first, and the generator earns its way in against it.' }
      ]
    },
    {
      slug: 'profile-builder', title: 'Profile Builder', what: 'Risk intelligence', sector: 'Risk intelligence', year: '2025',
      line: 'A full tech-stack revamp and AI extraction across a 35M+ entity database.',
      key: { n: '35M+', l: 'entities searchable' },
      dek: 'Replacing spreadsheet-driven analyst work with structured, auditable workflows.',
      role: 'Product manager', tools: 'JIRA, SQL, Postman',
      tags: ['Search', 'Entity resolution', 'Agile'],
      blocks: [
        { t: 'p', text: 'Led end-to-end Agile delivery of a full tech-stack revamp: backlog, sprint planning, stories and release management.' },
        { t: 'list', items: ['Listing module for entity resolution and classification', 'Advanced Global Search with filtered queries across 35M+ entities', 'AI extraction pipeline with source attribution and confidence thresholds that route low-certainty output to human review', 'User interviews, PRDs, journeys and wireframes; owned UAT through to release'] }
      ]
    },
    {
      slug: 'privacy-panda', title: 'Privacy Panda', what: 'DPDP compliance, 0 → 1', sector: 'Privacy · DPDP', year: '2025',
      line: 'A dual-portal compliance product, prototyped solo and approved as the build baseline.',
      key: { n: '58', l: 'endpoint API spec' },
      dek: 'Compliance is two opposing workflows. So we built two portals on one backbone.',
      role: 'Product owner, solo prototyper', tools: 'Claude Code, GPT, Antigravity, PostHog',
      tags: ['0 → 1', 'Prototyping', 'Privacy'],
      blocks: [
        { t: 'p', text: 'Data Principals need frictionless consent control. Data Fiduciaries need auditable evidence. I framed DPDP compliance as those two opposing workflows and designed a dual-portal product on a shared backbone.' },
        { t: 'p', text: 'With no dedicated engineering capacity, I built the working prototype myself using Claude Code, GPT and Antigravity. The executive team approved it as the build baseline.' },
        { t: 'figure', label: 'Diagram · dual portal on a shared backbone', caption: 'Each statutory obligation maps to one product capability.', h: 260 },
        { t: 'list', items: ['Product vision, personas, user stories and flows', 'Compliance architecture and a 58-endpoint multi-tenant API spec', 'PostHog event taxonomy set before build: consent funnel, data-rights drop-off, task success'] }
      ]
    }
  ],

  notes: [
    { slug: 'this-site', kind: 'built', date: '2026-09-28', title: 'This site: a portfolio you talk to', dek: 'A command box instead of a nav bar. Commands work now; AI answers are next. Built with Claude Code.', tags: ['Building'] },
    {
      slug: 'guardrails-are-the-product', kind: 'wrote', date: '2026-09-14', read: 8, title: 'Guardrails are the product', tags: ['AI', 'RegTech'], source: 'site',
      dek: 'The validation layer between an LLM and a regulated system matters more than the model behind it.',
      blocks: [
        { t: 'p', text: 'The first rule our model wrote for a client was wrong in a way that would have passed review. It flagged outbound transfers to new jurisdictions, exactly as asked, but counted the time window from the wrong timestamp.' },
        { t: 'p', text: 'That rule is why I stopped thinking of the model as the product. In a regulated system, the product is the set of checks that decide whether anything the model says is allowed to matter.' },
        { t: 'h2', text: 'Plausible is the failure mode' },
        { t: 'p', text: 'Language models are very good at producing output that looks correct. That’s useful when a person reads every line. It’s dangerous when the output is detection logic for a bank, where the cost of a quiet miss is a regulator’s finding.' },
        { t: 'quote', text: 'If a rule can’t prove it fires, it doesn’t ship. The model doesn’t get a vote.' },
        { t: 'h2', text: 'Three checks, in order' },
        { t: 'steps', items: [
          { n: '01', title: 'Schema validation', text: 'The rule must parse, reference fields that exist, and stay inside the DSL’s grammar.' },
          { n: '02', title: 'Golden regression', text: 'Known-good rules re-run on every change, so a new rule can’t quietly break an old one.' },
          { n: '03', title: 'Generated tests', text: 'Positive, negative and edge cases written with the rule. It has to fire, stay quiet, and survive the boundaries.' }
        ] },
        { t: 'code', file: 'rules/cross_border/rapid_outbound.yaml', lang: 'YAML', text: 'rule: rapid_outbound_new_jurisdiction\nsegment: cross_border\nwindow: 7d            # from value_date, not created_at\nwhen:\n  - txn.direction == "outbound"\n  - txn.country not in customer.known_jurisdictions\n  - count(txn) >= 5\nseverity: high\ntests: { positive: 12, negative: 9, edge: 6 }' },
        { t: 'figure', label: 'Chart · failures by gate, first 500 rules', caption: 'Fig. 1 — Where generated rules failed, by gate.', h: 240 },
        { t: 'h2', text: 'What this changes for a PM' },
        { t: 'p', text: 'Most of my time didn’t go into prompts. It went into deciding what “correct” meant, writing that down as tests, and getting compliance, engineering and QA to agree on it. The model gave us speed. The guardrails are why anyone was willing to use it.' }
      ]
    },
    { slug: 'eval-before-prompt', kind: 'learned', date: '2026-09-02', title: 'Write the eval before the prompt.', dek: 'I built the regression suite after the first hundred rules. Every week before that was a person reading YAML.', tags: ['AI'] },
    { slug: 'one-month-to-48-hours', kind: 'wrote', date: '2026-08-02', read: 11, title: 'One month to 48 hours', tags: ['AI', 'Product'], source: 'site',
      dek: 'Rebuilding client configuration around a generative workflow, and what it changed for sales.',
      blocks: [
        { t: 'p', text: 'Sales could close faster than we could configure. The ceiling on growth wasn’t demand; it was how many rules a small team could write and verify.' },
        { t: 'p', text: 'Draft — full essay lives in content/notes/one-month-to-48-hours.mdx.' }
      ] },
    { slug: 'guardrails-surface', kind: 'learned', date: '2026-07-24', title: 'Guardrails are product surface.', dek: 'What the system refuses to ship is a product decision, not infrastructure. Spec it like a feature.', tags: ['AI'] },
    { slug: 'consent-is-two-products', kind: 'wrote', date: '2026-07-19', read: 6, title: 'Consent is two products', tags: ['Privacy', 'Product'], source: 'medium', url: 'https://medium.com/',
      dek: 'Why DPDP compliance splits into a frictionless portal for people and an auditable one for companies.' },
    { slug: 'dpdp-shield-v1', kind: 'built', date: '2026-06-15', title: 'DPDP Shield, v1', dek: 'A public DPDP Act compliance prototype: consent flows for people, an evidence trail for companies.', tags: ['Building', 'Privacy'], url: 'https://dpdpshield.netlify.app' },
    { slug: 'confidence-is-ux', kind: 'learned', date: '2026-06-03', title: 'A confidence threshold is a UX decision.', dek: 'Where low-certainty output goes — a human, a retry, a refusal — shapes trust more than accuracy does.', tags: ['Product'] },
    { slug: 'write-the-prd-for-the-model', kind: 'wrote', date: '2026-05-27', read: 7, title: 'Write the PRD for the model', tags: ['AI', 'Product'], source: 'medium', url: 'https://medium.com/',
      dek: 'Specs, edge cases and acceptance criteria read differently when an LLM is the first engineer.' },
    { slug: 'prototype-ends-meeting', kind: 'learned', date: '2026-04-11', title: 'A prototype ends the meeting.', dek: 'Privacy Panda got approved because the executives could click it. Nobody asked for the PRD after that.', tags: ['Building'] },
    { slug: 'search-at-35-million', kind: 'wrote', date: '2026-03-08', read: 9, title: 'Search at 35 million entities', tags: ['Building'], source: 'site',
      dek: 'Filtered global search, entity resolution, and the real cost of a false match.',
      blocks: [{ t: 'p', text: 'Draft — full essay lives in content/notes/search-at-35-million.mdx.' }] },
    { slug: 'cost-is-a-feature', kind: 'learned', date: '2026-02-09', title: 'Cost is a feature.', dek: 'Identity resolution halved inference cost and raised coverage. The cheapest model call is the one you don’t make.', tags: ['AI'] },
    { slug: 'privacy-panda-prototype', kind: 'built', date: '2025-12-20', title: 'Privacy Panda prototype, solo', dek: 'No engineers free, so I built the working prototype with Claude Code, GPT and Antigravity. It became the build baseline.', tags: ['Building', 'Privacy'] },
    { slug: 'instrument-before-you-build', kind: 'wrote', date: '2025-12-11', read: 5, title: 'Instrument before you build', tags: ['Product'], source: 'medium', url: 'https://medium.com/',
      dek: 'Defining a PostHog event taxonomy before the first line of product code exists.' },
    { slug: 'sales-finds-tools', kind: 'learned', date: '2025-11-06', title: 'Sales will find your internal tool.', dek: 'The Source of Truth was built for us. Sales used it in demos within weeks. Design for the second user.', tags: ['Product'] },
    { slug: 'the-rule-you-already-have', kind: 'wrote', date: '2025-10-03', read: 6, title: 'The rule you already have', tags: ['AI', 'Building'], source: 'site',
      dek: 'Similarity search as a sales tool, not just a deduplication step.',
      blocks: [{ t: 'p', text: 'Draft — full essay lives in content/notes/the-rule-you-already-have.mdx.' }] }
  ],

  lab: [
    { name: 'DPDP Shield', status: 'Live', line: 'A public DPDP Act compliance prototype. Weekend build, real product thinking.', url: 'https://dpdpshield.netlify.app', cta: 'dpdpshield.netlify.app ↗' },
    { name: 'This site', status: 'WIP', line: 'A portfolio you talk to. Commands now, AI answers next.', cta: 'Type /' }
  ],
  toolbox: ['Claude Code', 'Antigravity', 'GPT', 'MCP', 'PostHog', 'Netlify']
};

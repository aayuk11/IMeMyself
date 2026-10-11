// Single source of truth for personal data: profile, experience, education, skills, lab, résumé.
// Pages and the /api/ask function read from here. Never hardcode this data in a component.
// Keep this file free of Astro imports: netlify/functions/ask.mts bundles it too.
// Case studies live in src/content/projects, essays in src/content/essays, short notes in src/content/notes.yaml.

export type PaletteId = 'matcha' | 'espresso' | 'midnight' | 'oxblood' | 'graphite';
export type TypeId = 'funnel' | 'cabinet' | 'host' | 'sentient' | 'arcade';
export type IntroVariant = 'rip' | 'peel' | 'shred' | 'off';

export interface Role {
  org: string;
  kind: string;
  role: string;
  period: string;
  place: string;
  summary: string;
}

export interface LabItem {
  name: string;
  status: 'Live' | 'WIP';
  line: string;
  /** External link. Without one, the CTA focuses the command box. */
  href?: string;
  cta: string;
}

export interface SiteConfig {
  name: string;
  /** Under the name in the sidebar. */
  tagline: string;
  /** Short site name shown in chat replies and on the résumé page. */
  handle: string;
  /** Fallback canonical URL. On Netlify the build uses the URL env var instead. */
  url: string;
  title: string;
  description: string;
  headline: string;
  bio: string;
  city: string;
  timezone: string;
  email: string;
  /** Shown on the résumé page only. */
  phone: string;
  socials: {
    linkedin: string;
    github: string;
    /** Medium username without the @. Empty hides Medium links and skips the RSS merge. */
    medium: string;
  };
  building?: { name: string; href: string };
  resume: { pdf: string; filename: string };
  experience: Role[];
  education: { degree: string; school: string; schoolFull: string; period: string; note: string };
  /** Experience page "Toolkit". */
  toolkit: { group: string; items: string }[];
  lab: LabItem[];
  /** Lab page "In rotation". */
  toolbox: string[];
  /** The printable résumé page (/resume). */
  resumePage: {
    headline: string;
    summary: string;
    roles: { name: string; what: string; points: string[] }[];
    skills: { group: string; items: string }[];
  };
  /** Name of the notes feed: "Field notes", "Logbook", "Notebook"… */
  notesName: string;
  /** First-visit look. Visitors can change palette, light/dark and type; their choice is remembered. */
  look: { palette: PaletteId; type: TypeId; sidebarTone: 'tinted' | 'ink' };
  /** PRD-tear intro on Home, once per session. 'off' disables it (/intro still replays it). */
  intro: IntroVariant;
  ask: {
    /** true: free-text questions are answered by AI via /api/ask (netlify/functions/ask). false: they route to pages ("AI answers soon"). */
    enabled: boolean;
    /** Under each AI answer. */
    footnote: string;
    /** Small line under the composer while AI answers are on. */
    notice: string;
    /** Voice and house rules for the model. The facts come from the site's own content (src/lib/knowledge.ts). {email} is filled in. */
    system: string;
    /** Life outside work. The AI uses it only when a visitor asks. */
    personal: string;
    /** Fixed replies, picked without the model. {email} and {cmd} are filled in. */
    lines: {
      offtopic: string[];
      /** One list per kind of private question (src/lib/guard.ts PrivateKind). */
      private: Record<'personal' | 'pay' | 'clients' | 'people' | 'hiring' | 'other', string[]>;
      command: { default: string } & Record<string, string>;
      /** Email, phone, "how do I reach him": answered without the model. */
      contact: string;
      unavailable: string;
      limit: string;
    };
  };
  pokedex: {
    number: string;
    species: string;
    types: [string, string];
    entries: { label: string; value: string }[];
    flavour: string;
    /** Image in public/ for the avatar slot, e.g. '/pokedex-avatar.png'. Hatched placeholder when empty. */
    avatar?: string;
  };
}

export const site: SiteConfig = {
  name: 'Aayush Kumar',
  tagline: 'PM who builds',
  handle: 'aayush.site',
  url: 'https://wehaveaayush.netlify.app',
  title: 'Aayush Kumar — PM who builds',
  description:
    'Aayush Kumar is a product manager who builds: two B2B SaaS platforms by day, and the AI systems behind them.',
  headline: 'Product, AI, and whatever I’m building this weekend.',
  bio: 'A PM who builds: two B2B SaaS platforms by day, solving problems by weekend. I learn in public, ship what I learn, and write it down.',
  city: 'Gurgaon',
  timezone: 'Asia/Kolkata',
  email: 'aayushkr117@gmail.com',
  phone: '+91 62028 53016',
  socials: {
    linkedin: 'https://linkedin.com/in/aayushkumar07',
    github: 'https://github.com/aayuk11',
    medium: '',
  },
  // Home's "Building" pill. Hidden until DPDP Shield is cleared to feature; uncomment to bring it back.
  // building: { name: 'DPDP Shield', href: 'https://dpdpshield.netlify.app' },
  resume: { pdf: '/Aayush_Kumar_Resume.pdf', filename: 'Aayush_Kumar_Resume.pdf' },

  experience: [
    {
      org: 'ZIGRAM',
      kind: 'B2B RegTech & AI SaaS',
      role: 'Senior Analyst, Product Management',
      period: 'Jan 2025 — Present',
      place: 'India',
      summary: 'Own strategy, PRDs and FRDs, sprint grooming, stakeholder management and testing across three platforms, with a cross-functional team.',
    },
  ],
  education: {
    degree: 'B.Tech, Information Technology',
    school: 'GGSIPU, New Delhi',
    schoolFull: 'Guru Gobind Singh Indraprastha University, New Delhi',
    period: '2021 — 2025',
    note: 'CGPA 9.08 / 10',
  },
  toolkit: [
    { group: 'AI', items: 'LLM apps, agentic workflows, RAG, prompt & context engineering, evals & guardrails, MCP, Claude Code' },
    { group: 'Product', items: 'Strategy, discovery, research, PRD / FRD, roadmapping, 0 → 1, GTM, KPIs' },
    { group: 'Delivery', items: 'Agile / Scrum, sprint grooming, release management, testing & UAT, stakeholder management, JIRA, Confluence, Excel' },
    { group: 'Technical', items: 'Python, SQL, REST APIs, Postman, PostHog, Git, CI/CD' },
    { group: 'Domain', items: 'RegTech, AML / CFT, KYC, fraud, sanctions & PEP, entity resolution, DPDP Act 2023' },
  ],
  lab: [
    // Hidden until DPDP Shield is cleared to feature (same as Home's "Building" pill). Uncomment to bring it back.
    /* {
      name: 'DPDP Shield',
      status: 'Live',
      line: 'A public DPDP Act compliance prototype. Weekend build, real product thinking.',
      href: 'https://dpdpshield.netlify.app',
      cta: 'dpdpshield.netlify.app ↗',
    }, */
    { name: 'This site', status: 'WIP', line: 'A portfolio you talk to. Ask it about my work, or type / for everything else.', cta: 'Type /' },
  ],
  toolbox: ['Claude Code', 'Antigravity', 'GPT', 'MCP', 'PostHog', 'Netlify'],

  resumePage: {
    headline: 'Product manager who builds',
    summary:
      'Product manager who builds. I own three B2B SaaS platforms end to end and personally build the AI systems behind them, including a generative AI workflow that took a surveillance product from 1 to 20+ clients in two months.',
    roles: [
      {
        name: 'Transact Comply',
        what: 'AI transaction monitoring & surveillance',
        points: [
          'Grew the platform from 1 to 20+ clients in two months across banking, NBFC, insurance, housing finance, crypto and payments in India, UK and Nepal.',
          'Designed and built a generative AI workflow (Claude Code) converting regulatory scenarios into production rules, edge-case test data and deployment, cutting client configuration from 1 month to under 48 hours.',
          'Created 500+ production rules across cross-border, crypto, capital markets and NBFC segments, removing the delivery ceiling on pre-sales and onboarding.',
          'Built a Source of Truth layer with AI similarity search, now used by sales, implementation and product to scope deals and prove coverage in live demos.',
          'Engineered guardrails: schema validation, a golden-rule regression suite and generated positive, negative and edge tests.',
          'Cut AI inference cost 50% and raised detection coverage 10% via cross-account identity resolution; automated SFTP ingestion across 40+ file formats.',
        ],
      },
      {
        name: 'Profile Builder',
        what: 'Risk intelligence platform, 35M+ entities',
        points: [
          'Led end-to-end Agile delivery of a full tech-stack revamp, owning backlog grooming, sprint planning, story writing and release management.',
          'Built the listing module for entity resolution and classification, and shipped Advanced Global Search across 35M+ entities.',
          'Defined an AI extraction pipeline with source attribution and confidence thresholds routing low-certainty output to human review.',
          'Ran user interviews, authored PRDs, FRDs and journeys, and drove UAT sign-off through to production.',
        ],
      },
      {
        name: 'Privacy Panda',
        what: 'DPDP Act 2023 compliance SaaS, 0 → 1',
        points: [
          'Framed DPDP compliance as two opposing workflows and designed a dual-portal product on a shared backbone.',
          'Built the working prototype independently with Claude Code, GPT and Antigravity; approved by the executive team as the build baseline.',
          'Authored vision, personas, flows, compliance architecture and a 58-endpoint multi-tenant API specification.',
          'Instrumented PostHog with an event taxonomy for consent funnels, data-rights drop-off and task success.',
        ],
      },
    ],
    skills: [
      { group: 'Product', items: 'Strategy, discovery, user research, PRD / BRD / FRD, user stories, wireframing, roadmapping, prioritisation, 0 → 1, GTM, KPIs' },
      { group: 'Delivery', items: 'Agile, Scrum, sprint planning, release management, JIRA, SDLC, UAT, functional & UI testing, stakeholder management' },
      { group: 'AI & technical', items: 'Generative AI, LLM applications, prompt & context engineering, RAG, agentic workflows, AI evaluation & guardrails, Claude Code, GPT, MCP, SQL, Python, REST APIs, Postman, PostHog, Git, CI/CD' },
      { group: 'Domain', items: 'RegTech, FinTech, transaction monitoring, AML / CFT, KYC, fraud, capital markets surveillance, sanctions & PEP screening, entity resolution, DPDP Act 2023' },
    ],
  },

  notesName: 'Field notes',
  look: { palette: 'matcha', type: 'funnel', sidebarTone: 'tinted' },
  intro: 'rip',

  ask: {
    enabled: true,
    footnote: 'Answered by AI from what’s on this site',
    notice: 'Questions go to an AI to answer. Nothing is saved.',
    system:
      'Answer as Aayush, in the first person, the way I’d talk to a recruiter or a fellow builder: plain words, short sentences, specific facts and numbers from the context. No hype, no buzzwords, no “great question”. Two to four sentences. If the facts aren’t in the context, say I haven’t written about that here and suggest emailing {email}. Never invent numbers, dates, employers, clients or tools. Never commit to availability, notice period, salary, relocation or start dates; that’s a conversation for email. ZIGRAM is my employer and its clients stay confidential.',
    personal:
      'Outside work: fitness, Pokémon, One Piece, and Marvel and DC (Batman, Spider-Man, Thor). Weekends go to new AI tools and building things.',
    lines: {
      offtopic: [
        'Low priority. Ask me something else.',
        'Out of scope. I only know my own work.',
        'Not on my roadmap. Ask about what I’ve built.',
        'Wrong box for that. This one only knows about me.',
      ],
      private: {
        personal: ['My personal details aren’t up for discussion here. Ask me about my work.', 'That’s personal, so it stays off the site. Happy to talk about the work.'],
        pay: ['Not something I share here. Email {email} and we can talk.'],
        clients: ['Client details stay confidential. I can tell you how I worked, not who for.'],
        people: ['I don’t talk about colleagues here. Ask me about the work.'],
        hiring: ['That’s your call to make. Talk to me first, and you might want to: {email}.'],
        other: ['That stays off the site. Ask me about my work, or email {email}.'],
      },
      command: {
        default: 'That’s {cmd}. Tap it below or type it.',
        '/crash': 'That’s /crash. Type it and stand back.',
        '/sisyphus': '/sisyphus. One must imagine the PM happy.',
      },
      contact: 'Email is the quickest way to reach me: {email}. My phone number is on my résumé, and LinkedIn works too.',
      unavailable: 'The model’s resting. These are the best places to start.',
      limit: 'That’s plenty for one visit. Email me at {email} for the rest.',
    },
  },

  pokedex: {
    number: '0117',
    species: 'The Builder Pokémon',
    types: ['Product', 'AI'],
    entries: [
      { label: 'Ability', value: 'Weekend Build — ships faster when nobody’s watching' },
      { label: 'Moves', value: 'Spec · Prototype · Prompt · Deadlift' },
      { label: 'Weakness', value: 'A new AI tool launching at 2 a.m.' },
      { label: 'Habitat', value: 'Between a PRD and a terminal' },
    ],
    flavour:
      'Evolves when handed a hard problem and a deadline. Has been seen rewatching a whole One Piece arc while a build runs.',
    avatar: '/pokedex-avatar.webp',
  },
};

// ─────────────────────────────────────────────────────────────
//  ALL SITE CONTENT LIVES HERE.
//  Edit this file to update the website — no other file needed.
//  Search for "TODO" to find details that still need filling in.
//
//  The site has two pages:
//    • Career (index.html): profile, about, career, impact, projects, skills, contact
//    • Life   (life.html):  lifeIntro, story, topThree, hobbies, travels, elsewhere
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: "Liew Chen Tzer",
  shortName: "Chen Tzer",
  initials: "LCT",
  title: "Software Engineer",
  // One-liner shown under your name in the hero.
  tagline: "Software engineer building payment systems that hold up under pressure, from bank mainframes to cross-border fintech.",
  // Personality words that cycle in the hero.
  traits: ["Curious", "Adaptive", "Resilient"],
  location: "Selangor, Malaysia",
  coords: "03°04′N 101°31′E",
  photo: null, // TODO: e.g. "assets/me.jpg" — until set, a holographic monogram is shown
  resume: null, // TODO: e.g. "assets/Liew_Chen_Tzer_Resume.pdf" — the button activates once set
  available: true, // shows the "open to conversations" indicator
};

// ═════════════════════════════ CAREER PAGE ═════════════════════════════

export const about = {
  heading: "From bank mainframes to cross-border fintech.",
  paragraphs: [
    "I'm a software engineer at ENTIIS. Before that I spent a year and a half at Ant International, first building cross-border payment APIs as a Java engineer, then as Service Owner of a chargeback platform that handles over a million cases a year. I started my career writing COBOL at Maybank, then built e-wallet APIs with Play and Spring at Boost (Axiata Digital).",
    "Across every role the common thread is ownership: writing the API specs other teams build on, tracing production issues down to the log line, and running a service end to end with the numbers to show for it. I graduated in Software Engineering from Asia Pacific University in 2022.",
  ],
  stats: [
    { value: "1M+", label: "Chargeback cases governed a year" },
    { value: "99.89%", label: "Chargeback completion rate" },
    { value: "4 yrs", label: "Professional experience" },
    { value: "4", label: "Companies · banking, e-wallet, fintech, consulting" },
  ],
};

// Career timeline. Newest FIRST. kind: "education" | "career"
export const career = [
  {
    kind: "career",
    year: "Since May 2026",
    title: "Software Engineer",
    place: "ENTIIS Pte Ltd · Petaling, Selangor · Hybrid",
    text: "TODO: one line on what you work on at ENTIIS.",
    current: true,
  },
  {
    kind: "career",
    year: "Jul 2025 – Apr 2026",
    title: "Service Owner",
    place: "Ant International · Kuala Lumpur",
    text: "Owned the chargeback service end to end, from system health to operational results.",
    bullets: [
      "Governed 1M+ chargeback cases a year with a 1.39-day average handling time and a 99.89% completion rate.",
      "Led the restructuring of a core chargeback processing system to improve maintainability and risk monitoring.",
      "Achieved a 31.4% chargeback success rate while business volume grew 9.3% and chargeback channel operations 29%.",
      "Improved operational efficiency by 30%, cutting required manpower from 13.2 to 9.3 and improving exception handling by 22.59%.",
    ],
    tags: ["Ownership", "Chargebacks", "Risk", "Java"],
  },
  {
    kind: "career",
    year: "Dec 2024 – Jul 2025",
    title: "Java Software Engineer",
    place: "Ant International · Kuala Lumpur",
    text: "Backend engineer on cross-border payment modules.",
    bullets: [
      "Supported backend ownership of cross-border payment modules, keeping them reliable and transactions accurate.",
      "Developed APIs for auto-debit unbinding and cross-role card sharing, aligning requirements across multiple teams.",
    ],
    tags: ["Java", "Spring Boot", "Payments", "E-Wallet"],
  },
  {
    kind: "career",
    year: "Nov 2022 – Nov 2024",
    title: "Associate Software Engineer",
    place: "Boost (Axiata Digital) · Kuala Lumpur",
    text: "Built and maintained APIs for Boost, Axiata Digital's e-wallet, working closely with business analysts, product owners and other development teams.",
    bullets: [
      "Implemented and enhanced APIs in Java with the Play and Spring frameworks (MVC).",
      "Wrote and delivered API specifications so other teams could integrate smoothly.",
      "Shipped to production through Jenkins and resolved production issues by tracing logs in Elasticsearch.",
    ],
    tags: ["Java", "Play Framework", "Spring", "Jenkins", "Elasticsearch"],
  },
  {
    kind: "career",
    year: "Sep – Nov 2022",
    title: "COBOL Developer",
    place: "Maybank · Kuala Lumpur",
    text: "Started my career on the mainframe at Malaysia's largest bank, working with COBOL and JCL on ATM systems.",
    tags: ["COBOL", "JCL", "Mainframe"],
  },
  {
    kind: "education",
    year: "2022",
    title: "BSc (Hons) Software Engineering",
    place: "Asia Pacific University (APU)",
    text: "Final year project: an Android emergency-button app that alerts help with a single press.",
    tags: ["Java", "Android"],
    link: { label: "View FYP", href: "https://github.com/chentzer/Final_Year_Project" },
  },
  {
    kind: "career",
    year: "Apr – Jul 2021",
    title: "Management Trainee (Intern)",
    place: "Glocomp Systems · Selangor",
    text: "Built automation bots with Automation Anywhere to streamline workflows on live projects, after learning the platform through hands-on training.",
    tags: ["RPA", "Automation Anywhere"],
  },
];

// Impact cards on the Career page. `featured` makes one card large.
export const achievements = [
  {
    title: "1M+ chargebacks a year",
    org: "Ant International · Service Owner",
    year: "2025 – 26",
    text: "Governed end to end with a 99.89% completion rate and a 1.39-day average handling time.",
    featured: true,
    badge: "Service Owner",
    glyph: "◈",
  },
  {
    title: "30% more efficient",
    org: "Ant International",
    year: "2025 – 26",
    text: "Cut required manpower from 13.2 to 9.3 and improved exception handling efficiency by 22.59%.",
  },
  {
    title: "31.4% success rate",
    org: "Ant International",
    year: "2025 – 26",
    text: "Chargeback success rate, achieved while business volume grew 9.3% and chargeback channel operations 29%.",
  },
  {
    title: "BSc (Hons) Software Engineering",
    org: "Asia Pacific University",
    year: "2022",
    text: "Graduated with a final year project focused on personal safety and emergency response.",
  },
  // TODO: certifications, awards at work…
];

// Projects on the Career page, in two groups.
// Work: real company projects. TODO: expand into one card per project from the résumé.
export const workProjects = [
  {
    title: "Company Projects",
    classified: true,
    text: "Production systems at Ant International, Boost (Axiata Digital) and Maybank, covering cross-border payments, chargebacks, e-wallet APIs and ATM systems. Most details stay internal, but I'm happy to talk about the problems I solved.",
    tags: ["Java", "Spring Boot", "Play Framework", "COBOL"],
  },
];

// Passion projects: things built on my own time. `year` = when the project started.
export const passionProjects = [
  {
    title: "Media Tracker",
    subtitle: "Manga + Video",
    year: "2026", // first commit: Sep 2026
    text: "A React Native (Expo) app with built-in webviews that records every manga or video you open, with deduplicated entries, cover thumbnails and optional Google Drive backup.",
    tags: ["React Native", "Expo", "JavaScript"],
    links: [{ label: "GitHub", href: "https://github.com/chentzer/manga_tracker" }],
  },
  {
    title: "Go Booking App",
    subtitle: "Learning Go",
    year: "2026", // first commit: Feb 2026
    text: "A booking application built while learning Go. TODO: one line on what it does.",
    tags: ["Go"],
    links: [{ label: "GitHub", href: "https://github.com/chentzer/go-booking-app" }],
  },
  {
    title: "Emergency Button",
    subtitle: "Final Year Project",
    year: "TODO", // the GitHub repo was only uploaded in 2024; confirm when you started it
    text: "An Android app that sends an emergency alert with a single tap, designed so someone in distress can get help with minimal interaction.",
    tags: ["Java", "Android", "Gradle"],
    links: [{ label: "GitHub", href: "https://github.com/chentzer/Final_Year_Project" }],
  },
];

export const skills = [
  { group: "Languages", items: ["Java", "COBOL", "JCL", "Go", "JavaScript", "SQL"] },
  { group: "Frameworks", items: ["Spring Boot", "Spring", "Play Framework", "React", "React Native"] },
  { group: "Data & Ops", items: ["MySQL", "Elasticsearch", "Jenkins", "Maven"] },
  { group: "Tools & Practices", items: ["Git", "Postman", "IntelliJ", "Automation Anywhere", "Scrum", "API specs"] },
];

// Live GitHub contribution graph (Career page). Set show: false to hide the section.
export const github = {
  show: true,
  user: "chentzer",
  note: "Side projects only. Most of my professional work lives in private company repositories.",
};

// Professional contact (Career page). Leave a field as null to hide it.
export const contact = {
  email: "liewct115@gmail.com", // already public on your GitHub profile; change or set to null if preferred
  linkedin: "https://www.linkedin.com/in/chentzer/",
  github: "https://github.com/chentzer",
  blog: null, // Medium / dev.to, if you start writing
};

// ══════════════════════════════ LIFE PAGE ══════════════════════════════

export const lifeIntro = {
  heading: "Beyond the code.",
  paragraphs: [
    "I grew up in Selangor, Malaysia. Outside work you'll find me at the gym, deep in a game or a manga, travelling, or playing J-pop and C-pop on repeat.",
    "One band in particular changed things for me. The story is below.",
  ],
  stats: [
    { value: "110", label: "Perfect games on Steam" },
    { value: "2,284", label: "Anime episodes watched" },
    { value: "4,700+", label: "Manga chapters read" },
    // Counts the countries in `travels` below, so it updates when you add places.
    { label: "Countries visited", get value() { return String(new Set(travels.map((t) => t.country)).size); } },
  ],
};

// Personal timeline. Newest FIRST.
export const story = [
  {
    kind: "life",
    year: "2022",
    title: "Learning Japanese, for real this time",
    place: "Started at ICLS · now self-studying",
    text: "I tried learning Japanese in high school more than once, and it never stuck. Those failed attempts are exactly why I signed up for a course at ICLS: to hold myself accountable and keep showing up. Now I'm self-studying for N2.",
    // JLPT tracker: done = passed (note = when), goal = current target.
    progress: [
      { label: "N5", note: "Aug 2024", done: true },
      { label: "N4", note: "Jan 2026", done: true },
      { label: "N3" },
      { label: "N2", note: "Self-studying", goal: true },
      { label: "N1" },
    ],
    tags: ["日本語", "JLPT N4", "Consistency"],
  },
  {
    kind: "life",
    year: "2019 – 20",
    title: "Racing into the night",
    place: "YOASOBI",
    scene: "yoasobi",
    text: "A month or two after YOASOBI debuted, a friend played me 夜に駆ける (Yoru ni Kakeru). The melody and the vocals stopped me in my tracks. I went digging into the lyrics and found the idea behind them: every YOASOBI song is a novel turned into music.",
    bullets: [
      "They're the reason I got into J-pop.",
      "During the hardest stretch of university, their songs and what they meant helped me keep pushing through.",
    ],
    tags: ["J-pop", "Resilience"],
    embed: "https://open.spotify.com/embed/track/3dPtXHP0oXQ4HCWHsOA9js",
  },
  {
    kind: "life",
    year: "2017",
    title: "My first job",
    place: "Waiter · Madam Kwan's",
    text: "I only lasted a month, but it was the first time I felt the real pain of being a working adult.",
  },
  {
    kind: "life",
    year: "2017",
    title: "King Scout",
    place: "High school",
    text: "Earned the King Scout award, and served as Vice President of the Scouts and on the Board of Librarians.",
  },
  {
    kind: "life",
    year: "2000",
    title: "Hello, world",
    place: "Selangor, Malaysia",
    text: "Arrived at the turn of the millennium and grew up in Selangor. Where it all started.",
    // A tiny code editor that types itself out. `lines` are Java; `output` is what the "console" prints.
    code: {
      file: "HelloWorld.java",
      lines: [
        'Human chenTzer = new Human("Liew Chen Tzer");',
        'chenTzer.bornIn(2000).at("Selangor, Malaysia");',
        "chenTzer.spawn();",
        'System.out.println("Hello, world");',
      ],
      output: ["Hello, world", "Process running since 2000. No crashes so far."],
    },
  },
];

// Context backgrounds: when a story entry with `scene: "<name>"` is on screen,
// the page background, accent colour and 3D particles shift to match it.
export const scenes = {
  yoasobi: {
    image: "https://i.scdn.co/image/ab67616d0000b273c5716278abba6a103ad13aa7", // 夜に駆ける cover (Spotify CDN)
    accent: "#ff8f9c",   // coral pink from the cover
    accent2: "#62c6c8",  // teal from the cover
    nowPlaying: { title: "夜に駆ける", artist: "YOASOBI", href: "https://open.spotify.com/track/3dPtXHP0oXQ4HCWHsOA9js" },
    credit: "Cover art: 夜に駆ける © YOASOBI / Sony Music Entertainment (Japan)",
  },
};

// Yearly Top 3 (Life page). Each December, add a new year at the top:
//   music: top songs from Spotify Wrapped. spotify = the song's share link (cover art loads automatically).
//   games: top games from Steam Replay. steam = the number in the game's store URL (header image loads automatically).
// A year with no music (or no games) just shows the other column.
export const topThree = [
  {
    year: 2025,
    music: [
      // TODO: your top 3 songs from Spotify Wrapped 2025, e.g.
      // { song: "夜に駆ける", artist: "YOASOBI", spotify: "https://open.spotify.com/track/3dPtXHP0oXQ4HCWHsOA9js" },
    ],
    games: [
      { title: "Idle Cave Miner", steam: 2289450, note: "39% of my play time · 100% achievements" },
      { title: "Dota 2", steam: 570, note: "373 sessions" },
      { title: "Frostpunk", steam: 323190, note: "Picked it back up in June · 100% achievements" },
    ],
  },
];

export const hobbies = [
  { icon: "game", title: "Gaming", text: "From Dota 2 and Frostpunk to Celeste. 9,800+ achievements and 110 perfect games." },
  { icon: "book", title: "Manga & Anime", text: "150+ manga and nearly 200 anime logged. Manga is the main habit, enough that I built an app to track it." },
  { icon: "gym", title: "Gym", text: "Consistency over intensity. Progress comes from showing up." },
  { icon: "music", title: "Music", text: "J-pop, C-pop and Pop on heavy rotation: YOASOBI, Da-iCE, AiNA THE END, Gareth.T." },
  { icon: "plane", title: "Travel", text: "Exploring new cities, new food and new perspectives." }, // TODO: places you've been
  { icon: "globe", title: "Languages", text: "Self-studying Japanese: JLPT N4, aiming for N2. Always picking up a new programming language too." },
];

// Travel globe (Life page). Add every place you've been.
// lat/lon: search "<place> coordinates" and use the decimal numbers (south and west are negative).
export const travels = [
  { place: "Selangor", country: "Malaysia", lat: 3.07, lon: 101.52, home: true, note: "Home base. Where it all started." },
  { place: "Singapore", country: "Singapore", lat: 1.29, lon: 103.85, year: "2026", note: "Saw YOASOBI live, the second time." },
  // TODO: e.g. { place: "Tokyo", country: "Japan", lat: 35.68, lon: 139.69, year: "2024", note: "One line about the trip." },
];

// Personal profiles (Life page). Leave href as null to hide one.
export const elsewhere = [
  { key: "instagram", label: "Instagram", href: "https://www.instagram.com/chentzer/", text: "Travel and everyday life." },
  { key: "spotify", label: "Spotify", href: "https://open.spotify.com/user/fanxu", text: "What's on repeat right now." },
  { key: "steam", label: "Steam", href: "https://steamcommunity.com/id/killerx3000/", text: "9,800+ achievements, 110 perfect games." },
  // On hold for now; to show it, set the href:
  { key: "anilist", label: "MyAnimeList", href: null /* "https://myanimelist.net/profile/ChenTzer" */, text: "Everything I've watched and read." },
];

// Guestbook (Life page), powered by giscus + GitHub Discussions.
// It stays hidden until categoryId is filled in. Setup steps are in the README.
export const guestbook = {
  repo: "chentzer/personal_portfolio",
  repoId: "R_kgDOVKUXuA",
  category: "Guestbook",
  categoryId: "DIC_kwDOVKUXuM4DIfSb",
};

// ══════════════════════════════ SITE-WIDE ══════════════════════════════

// Visitor stats with GoatCounter (free, no cookies). Stays off until you set your code,
// e.g. "chentzer" for https://chentzer.goatcounter.com. Visits from localhost aren't counted.
export const analytics = {
  goatcounter: "chentzer", // dashboard: https://chentzer.goatcounter.com
};

// Link-preview image (the card shown when the site is shared on LinkedIn, WhatsApp, etc.).
// Must be a full URL. Update it if you move to a custom domain.
export const site = {
  url: "https://chentzer.github.io/personal_portfolio/",
};

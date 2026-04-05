interface PortfolioProject {
  name: string;
  status: string;
}

interface PortfolioCertification {
  title: string;
  year: string;
  issuer: string;
}

interface PortfolioKnowledge {
  person: {
    fullName: string;
    role: string;
    tagline: string;
    location: string;
    availability: string;
    internship: string;
    focus: string[];
  };
  contacts: {
    email: string;
    github: string;
    linkedin: string;
    instagram: string;
  };
  projects: PortfolioProject[];
  certifications: PortfolioCertification[];
}

export const defaultQuestionSuggestions: string[] = [
  "Siapa Muhammad Fikri Haikal?",
  "Fokus skill utama Haikal apa saja?",
  "Project unggulan di portfolio ini apa saja?",
  "Apakah Haikal terbuka untuk kerja, kolaborasi, atau internship?",
  "Layanan apa yang bisa dikerjakan Haikal?",
  "Bagaimana cara menghubungi Haikal?",
];

export const portfolioKnowledge: PortfolioKnowledge = {
  person: {
    fullName: "Muhammad Fikri Haikal",
    role: "Software Engineer",
    tagline: "Backend, IoT, and cloud oriented software builder",
    location: "Ciamis, Jawa Barat, Indonesia",
    availability:
      "Open for work opportunities, collaboration projects, and internship roles.",
    internship:
      "Software Engineer Intern at Sakata Innovation Center, developing Niskala and KWS web applications while building IoT prototypes.",
    focus: [
      "Backend and frontend engineering with Laravel, PHP, and JavaScript",
      "IoT prototyping and robotics with Arduino and sensors",
      "Cloud fundamentals on AWS and GCP",
      "AI and ML exploration using Python and Jupyter Notebook",
      "Data workflow, visualization, and mentoring delivery",
    ],
  },
  contacts: {
    email: "fikrihaikal170308@gmail.com",
    github: "https://github.com/fikrihaikal17",
    linkedin: "https://www.linkedin.com/in/fikriihaikal",
    instagram: "https://www.instagram.com/fikrii_haikalll17/",
  },
  projects: [
    { name: "Calakan - Islamic PWA", status: "Deployed" },
    { name: "Niskala - Publishing Platform", status: "Internship Project" },
    { name: "KWS - Kumpulan Wargi Sukapura", status: "Internship Project" },
    { name: "Smart Automatic Trash Bin (IoT)", status: "Prototype" },
    { name: "School Robotics Dashboard", status: "On Development" },
    { name: "Internship Task Tracker", status: "On Development" },
    { name: "Smart Classroom Monitor (IoT)", status: "Prototype" },
    { name: "Portfolio CMS Admin", status: "On Development" },
  ],
  certifications: [
    {
      title: "Back-End with JavaScript",
      year: "2026",
      issuer: "Dicoding Indonesia",
    },
    {
      title: "Web App with React",
      year: "2026",
      issuer: "Dicoding Indonesia",
    },
    {
      title: "AWS Cloud Practitioner",
      year: "2024",
      issuer: "Dicoding Indonesia",
    },
    {
      title: "HTML, CSS and JavaScript",
      year: "2024",
      issuer: "Programmer Zaman Now (Udemy)",
    },
    {
      title: "Data Visualization Fundamentals",
      year: "2024",
      issuer: "Dicoding Indonesia",
    },
    {
      title: "TOEIC Official Score 565",
      year: "2025",
      issuer: "ETS / Direktorat SMK",
    },
    {
      title: "TOEIC Score 835",
      year: "2025",
      issuer: "BLTI",
    },
  ],
};

export const buildPortfolioContext = (): string => {
  const focus = portfolioKnowledge.person.focus.map((item) => `- ${item}`).join("\n");
  const projects = portfolioKnowledge.projects
    .map((project) => `- ${project.name} (${project.status})`)
    .join("\n");
  const certifications = portfolioKnowledge.certifications
    .map((certification) => `- ${certification.title} | ${certification.issuer} | ${certification.year}`)
    .join("\n");

  return [
    "PERSON",
    `- Name: ${portfolioKnowledge.person.fullName}`,
    `- Role: ${portfolioKnowledge.person.role}`,
    `- Tagline: ${portfolioKnowledge.person.tagline}`,
    `- Location: ${portfolioKnowledge.person.location}`,
    `- Availability: ${portfolioKnowledge.person.availability}`,
    `- Internship: ${portfolioKnowledge.person.internship}`,
    "",
    "FOCUS AREAS",
    focus,
    "",
    "PROJECTS",
    projects,
    "",
    "CERTIFICATIONS",
    certifications,
    "",
    "CONTACT",
    `- Email: ${portfolioKnowledge.contacts.email}`,
    `- GitHub: ${portfolioKnowledge.contacts.github}`,
    `- LinkedIn: ${portfolioKnowledge.contacts.linkedin}`,
    `- Instagram: ${portfolioKnowledge.contacts.instagram}`,
  ].join("\n");
};

const hasAny = (text: string, keys: string[]): boolean => {
  return keys.some((key) => text.includes(key));
};

export const buildLocalFaqReply = (rawMessage: string): string | null => {
  const message = rawMessage.toLowerCase();

  if (
    hasAny(message, [
      "bisa tanya apa",
      "pertanyaan apa",
      "apa saja yang bisa ditanya",
      "contoh pertanyaan",
      "what can i ask",
      "what can i ask you",
    ])
  ) {
    return [
      "Kamu bisa tanya hal-hal ini:",
      `1) ${defaultQuestionSuggestions[0]}`,
      `2) ${defaultQuestionSuggestions[1]}`,
      `3) ${defaultQuestionSuggestions[2]}`,
      `4) ${defaultQuestionSuggestions[3]}`,
      `5) ${defaultQuestionSuggestions[4]}`,
      `6) ${defaultQuestionSuggestions[5]}`,
    ].join("\n");
  }

  if (
    (hasAny(message, ["siapa", "who"]) && hasAny(message, ["haikal", "fikri"])) ||
    hasAny(message, ["tentang kamu", "about you"])
  ) {
    return [
      `${portfolioKnowledge.person.fullName} adalah ${portfolioKnowledge.person.role}.`,
      `Fokus utamanya adalah backend, IoT, dan cloud, dengan pengalaman magang di Sakata Innovation Center (proyek Niskala dan KWS).`,
      `Lokasi: ${portfolioKnowledge.person.location}.`,
    ].join(" ");
  }

  if (
    hasAny(message, [
      "kerja",
      "pekerjaan",
      "hire",
      "freelance",
      "kolaborasi",
      "kerjasama",
      "kerja sama",
      "internship",
      "magang",
    ])
  ) {
    return [
      `Ya, ${portfolioKnowledge.person.fullName} terbuka untuk peluang kerja, kolaborasi, dan internship.`,
      `Untuk lanjut diskusi, bisa hubungi email ${portfolioKnowledge.contacts.email} atau LinkedIn ${portfolioKnowledge.contacts.linkedin}.`,
    ].join(" ");
  }

  if (hasAny(message, ["kontak", "contact", "email", "hubungi"])) {
    return [
      `Anda bisa menghubungi ${portfolioKnowledge.person.fullName} via email ${portfolioKnowledge.contacts.email}.`,
      `Profil profesional: GitHub ${portfolioKnowledge.contacts.github} dan LinkedIn ${portfolioKnowledge.contacts.linkedin}.`,
    ].join(" ");
  }

  if (hasAny(message, ["layanan", "jasa", "services", "offer", "bisa bantu apa", "bisa kerjain apa"])) {
    return [
      `${portfolioKnowledge.person.fullName} bisa membantu di:`,
      "1) Pengembangan backend/frontend web (Laravel, PHP, JavaScript).",
      "2) Prototyping IoT dan robotics berbasis Arduino + sensor.",
      "3) Integrasi cloud dasar (AWS/GCP) dan workflow data.",
      "4) Eksplorasi AI/ML dengan Python dan Jupyter untuk use case awal.",
    ].join(" ");
  }

  if (hasAny(message, ["lokasi", "domisili", "remote", "wfo", "hybrid"])) {
    return [
      `Lokasi ${portfolioKnowledge.person.fullName}: ${portfolioKnowledge.person.location}.`,
      "Terbuka untuk kolaborasi lintas lokasi, termasuk model remote sesuai kebutuhan proyek.",
    ].join(" ");
  }

  if (hasAny(message, ["kenapa harus", "why hire", "kelebihan", "strength", "nilai plus"])) {
    return [
      "Nilai plus Haikal: kombinasi backend engineering, IoT prototyping, dan eksplorasi cloud/AI.",
      "Pengalaman magang nyata di Sakata Innovation Center pada proyek web (Niskala dan KWS) serta prototipe IoT.",
    ].join(" ");
  }

  if (hasAny(message, ["project", "proyek", "portfolio", "karya"])) {
    const topProjects = portfolioKnowledge.projects.slice(0, 4).map((item) => item.name).join(", "
    );
    return `Beberapa proyek utama di portfolio: ${topProjects}. Jika Anda mau, saya bisa jelaskan detail salah satu proyek.`;
  }

  if (hasAny(message, ["skill", "keahlian", "fokus", "tech stack"])) {
    const focusList = portfolioKnowledge.person.focus
      .slice(0, 4)
      .map((item, index) => `${index + 1}) ${item}`)
      .join(" ");
    return `Fokus keahlian ${portfolioKnowledge.person.fullName}: ${focusList}`;
  }

  if (hasAny(message, ["sertifikat", "certification", "toeic", "dicoding"])) {
    const topCerts = portfolioKnowledge.certifications
      .slice(0, 3)
      .map((cert) => `${cert.title} (${cert.year})`)
      .join(", ");
    return `Sertifikasi yang ditampilkan antara lain: ${topCerts}.`;
  }

  return null;
};

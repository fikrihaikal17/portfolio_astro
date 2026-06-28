const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Parse .env manually
const env = {};
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const k = trimmed.substring(0, eqIdx).trim();
      const v = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      env[k] = v;
    }
  });
}

const host = env.DB_HOST || '127.0.0.1';
const port = Number(env.DB_PORT || '3306');
const user = env.DB_USER || 'root';
const password = env.DB_PASSWORD || '';
const database = env.DB_NAME || 'portfolio_admin';

async function run() {
  console.log(`Connecting to database ${database} at ${host}:${port}...`);
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database
  });

  console.log('Creating portfolio_projects table...');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS portfolio_projects (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      link VARCHAR(255) NOT NULL,
      preview VARCHAR(255) NOT NULL,
      status_key VARCHAR(128) NOT NULL,
      status_text VARCHAR(128) NOT NULL,
      order_index INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('Creating portfolio_certificates table...');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS portfolio_certificates (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      provider VARCHAR(128) NOT NULL,
      year VARCHAR(4) NOT NULL,
      title VARCHAR(255) NOT NULL,
      issuer VARCHAR(255) NOT NULL,
      credential_id VARCHAR(128) NOT NULL,
      verification_url VARCHAR(255) NOT NULL,
      preview_pdf VARCHAR(255) NOT NULL,
      tags VARCHAR(255) NOT NULL,
      score VARCHAR(32) NULL,
      order_index INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('Creating site_translations table...');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS site_translations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      translation_key VARCHAR(255) NOT NULL,
      en TEXT NOT NULL,
      id_text TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_site_translations_key (translation_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed projects
  const initialProjects = [
    {
      title: "Calakan - Islamic PWA",
      link: "https://github.com/fikrihaikal17",
      preview: "https://calakan.smkn1ciamis.id",
      status_key: "projects.status.deployed",
      status_text: "Deployed",
      order_index: 0
    },
    {
      title: "Niskala - Publishing Platform",
      link: "https://github.com/fikrihaikal17",
      preview: "https://github.com/fikrihaikal17",
      status_key: "projects.status.internship",
      status_text: "Internship Project",
      order_index: 1
    },
    {
      title: "KWS - Kumpulan Wargi Sukapura",
      link: "https://github.com/fikrihaikal17",
      preview: "https://github.com/fikrihaikal17",
      status_key: "projects.status.internship",
      status_text: "Internship Project",
      order_index: 2
    },
    {
      title: "Smart Automatic Trash Bin (IoT)",
      link: "https://github.com/fikrihaikal17",
      preview: "https://github.com/fikrihaikal17",
      status_key: "projects.status.prototype",
      status_text: "Prototype",
      order_index: 3
    },
    {
      title: "School Robotics Dashboard",
      link: "https://github.com/fikrihaikal17",
      preview: "https://github.com/fikrihaikal17",
      status_key: "projects.status.onDevelopment",
      status_text: "On Development",
      order_index: 4
    },
    {
      title: "Internship Task Tracker",
      link: "https://github.com/fikrihaikal17",
      preview: "https://github.com/fikrihaikal17",
      status_key: "projects.status.onDevelopment",
      status_text: "On Development",
      order_index: 5
    },
    {
      title: "Smart Classroom Monitor (IoT)",
      link: "https://github.com/fikrihaikal17",
      preview: "https://github.com/fikrihaikal17",
      status_key: "projects.status.prototype",
      status_text: "Prototype",
      order_index: 6
    },
    {
      title: "Portfolio CMS Admin",
      link: "https://github.com/fikrihaikal17",
      preview: "https://github.com/fikrihaikal17",
      status_key: "projects.status.onDevelopment",
      status_text: "On Development",
      order_index: 7
    }
  ];

  console.log('Seeding initial projects if empty...');
  const [projectRows] = await connection.query('SELECT COUNT(*) as count FROM portfolio_projects');
  if (projectRows[0].count === 0) {
    for (const p of initialProjects) {
      await connection.query(
        'INSERT INTO portfolio_projects (title, link, preview, status_key, status_text, order_index) VALUES (?, ?, ?, ?, ?, ?)',
        [p.title, p.link, p.preview, p.status_key, p.status_text, p.order_index]
      );
    }
    console.log(`Seeded ${initialProjects.length} projects.`);
  } else {
    console.log('Projects already populated, skipping.');
  }

  // Seed certificates
  const initialCertificates = [
    {
      provider: "Dicoding",
      year: "2026",
      title: "Back-End with JavaScript",
      issuer: "Dicoding Indonesia",
      credential_id: "2VX35DR3JPYQ",
      verification_url: "https://www.dicoding.com/certificates/2VX35DR3JPYQ",
      preview_pdf: "/certificates/dicoding-back-end-javascript-2026.pdf",
      tags: "JavaScript,Back-End,API",
      score: null,
      order_index: 0
    },
    {
      provider: "Dicoding",
      year: "2026",
      title: "Web App with React",
      issuer: "Dicoding Indonesia",
      credential_id: "72ZDK42JVPYW",
      verification_url: "https://www.dicoding.com/certificates/72ZDK42JVPYW",
      preview_pdf: "/certificates/dicoding-react-web-app-2026.pdf",
      tags: "React,Web App,Front-End",
      score: null,
      order_index: 1
    },
    {
      provider: "Dicoding",
      year: "2024",
      title: "AWS Cloud Practitioner",
      issuer: "Dicoding Indonesia",
      credential_id: "2VX3RJY03ZYQ",
      verification_url: "https://www.dicoding.com/certificates/2VX3RJY03ZYQ",
      preview_pdf: "/certificates/dicoding-aws-cloud-practitioner-2024.pdf",
      tags: "AWS,Cloud,Fundamentals",
      score: null,
      order_index: 2
    },
    {
      provider: "Programmer Zaman Now",
      year: "2024",
      title: "HTML, CSS & JavaScript",
      issuer: "Programmer Zaman Now (Udemy)",
      credential_id: "UC-bd879002-97bc-45eb-b0b4-b78e6b64c3fd",
      verification_url: "https://udemy-certificate.s3.amazonaws.com/pdf/UC-bd879002-97bc-45eb-b0b4-b78e6b64c3fd.pdf",
      preview_pdf: "/certificates/udemy-html-css-js-pzn-2024.pdf",
      tags: "HTML,CSS,JavaScript",
      score: null,
      order_index: 3
    },
    {
      provider: "Dicoding",
      year: "2024",
      title: "Data Visualization Fundamentals",
      issuer: "Dicoding Indonesia",
      credential_id: "QLZ97QR37P5D",
      verification_url: "https://www.dicoding.com/certificates/QLZ97QR37P5D",
      preview_pdf: "/certificates/dicoding-data-visualization-fundamentals-2024.pdf",
      tags: "Data,Visualization,Fundamentals",
      score: null,
      order_index: 4
    },
    {
      provider: "ETS / Direktorat SMK",
      year: "2025",
      title: "TOEIC Official Score",
      issuer: "ETS / Direktorat SMK",
      credential_id: "DRIVE-1haIQfn4z4SQKYRsiNWbEKjDc1zmMJCjs",
      verification_url: "https://drive.google.com/file/d/1haIQfn4z4SQKYRsiNWbEKjDc1zmMJCjs/view",
      preview_pdf: "/certificates/toeic-ets-565-2025.pdf",
      tags: "TOEIC,English,Official Score",
      score: "565",
      order_index: 5
    },
    {
      provider: "BLTI",
      year: "2025",
      title: "TOEIC Score",
      issuer: "BLTI",
      credential_id: "DRIVE-1wee1DVHx1pgRT6ElqZLOMIeBTdO0UIpe",
      verification_url: "https://drive.google.com/file/d/1wee1DVHx1pgRT6ElqZLOMIeBTdO0UIpe/view",
      preview_pdf: "/certificates/toeic-blti-835-2025.pdf",
      tags: "TOEIC,English,High Score",
      score: "835",
      order_index: 6
    }
  ];

  console.log('Seeding initial certificates if empty...');
  const [certRows] = await connection.query('SELECT COUNT(*) as count FROM portfolio_certificates');
  if (certRows[0].count === 0) {
    for (const c of initialCertificates) {
      await connection.query(
        'INSERT INTO portfolio_certificates (provider, year, title, issuer, credential_id, verification_url, preview_pdf, tags, score, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [c.provider, c.year, c.title, c.issuer, c.credential_id, c.verification_url, c.preview_pdf, c.tags, c.score, c.order_index]
      );
    }
    console.log(`Seeded ${initialCertificates.length} certificates.`);
  } else {
    console.log('Certificates already populated, skipping.');
  }

  // Seed translations
  const initialTranslations = {
    "nav.home": { en: "Home", id: "Beranda" },
    "nav.work": { en: "Work", id: "Karya" },
    "nav.certification": { en: "Certification", id: "Sertifikasi" },
    "nav.expertise": { en: "Expertise", id: "Keahlian" },
    "nav.experience": { en: "Experience", id: "Pengalaman" },
    "nav.contact": { en: "Contact", id: "Kontak" },
    "home.greeting": { en: "Hi, I'm Muhammad Fikri Haikal", id: "Halo, saya Muhammad Fikri Haikal" },
    "home.roleLine1": { en: "Software", id: "Insinyur" },
    "home.roleLine2": { en: "Engineer", id: "Perangkat Lunak" },
    "home.taglinePrefix": {
      en: "Transforming ideas into practical digital solutions powered by",
      id: "Membangun solusi digital dengan fokus",
    },
    "home.taglineHighlight": { en: "backend, IoT, and cloud", id: "backend, IoT, dan cloud" },
    "home.taglineSuffix": { en: "expertise.", id: "." },
    "home.hero.techLabel": { en: "Core stack", id: "Stack utama" },
    "home.hero.connectLabel": { en: "Connect", id: "Terhubung" },
    "home.hero.signalTitle": { en: "Internship Snapshot", id: "Ringkasan Magang" },
    "home.hero.signalText": {
      en: "Software Engineer Intern at Sakata Innovation Center, developing Niskala and KWS web applications while building IoT prototypes.",
      id: "Software Engineer Intern di Sakata Innovation Center, mengembangkan aplikasi web Niskala dan KWS sambil membangun prototipe IoT.",
    },
    "home.hero.statusTitle": { en: "Current Focus", id: "Fokus Saat Ini" },
    "home.hero.statusItem1": {
      en: "Building backend and frontend solutions with real-world use cases in web and IoT.",
      id: "Membangun solusi backend dan frontend dengan use case nyata pada web dan IoT.",
    },
    "home.hero.statusItem2": {
      en: "Open to internship and collaborative opportunities in software development.",
      id: "Terbuka untuk peluang magang dan kolaborasi dalam pengembangan perangkat lunak.",
    },
    "home.hero.pill1": { en: "Backend Specialist", id: "Spesialis Backend" },
    "home.hero.pill2": { en: "IoT & Cloud", id: "IoT & Cloud" },
    "home.hero.pill3": { en: "AI/ML Explorer", id: "Eksplorator AI/ML" },
    "home.hero.ctaProjects": { en: "View Projects", id: "Lihat Proyek" },
    "home.hero.ctaDownloadCv": { en: "Download CV", id: "Unduh CV" },
    "home.focus.kicker": { en: "Experience Highlights", id: "Sorotan Pengalaman" },
    "home.focus.title": {
      en: "Software Engineer Intern at Sakata Innovation Center (Oct 2025 - Jan 2026).",
      id: "Software Engineer Intern di Sakata Innovation Center (Okt 2025 - Jan 2026).",
    },
    "home.focus.description": {
      en: "Developed Niskala and KWS web applications, built IoT prototypes, supported robotics training, and explored AI/ML using Python with Jupyter Notebook.",
      id: "Mengembangkan aplikasi web Niskala dan KWS, membuat prototipe IoT, mendukung pelatihan robotik, serta mengeksplorasi AI/ML menggunakan Python dan Jupyter Notebook.",
    },
    "home.focus.tag.1": { en: "Web Development", id: "Pengembangan Web" },
    "home.focus.tag.2": { en: "IoT Prototyping", id: "Prototyping IoT" },
    "home.focus.tag.3": { en: "AI/ML Exploration", id: "Eksplorasi AI/ML" },
    "home.focus.flow.title": { en: "Key Activities", id: "Aktivitas Utama" },
    "home.focus.flow.step.1": { en: "Build Apps", id: "Bangun Aplikasi" },
    "home.focus.flow.step.2": { en: "Mentor & Train", id: "Mentor & Pelatihan" },
    "home.focus.flow.step.3": { en: "Prototype IoT", id: "Prototipe IoT" },
    "home.focus.metric.1.label": { en: "Internship duration", id: "Durasi magang" },
    "home.focus.metric.1.value": { en: "3 Months", id: "3 Bulan" },
    "home.focus.metric.2.label": { en: "Primary role", id: "Peran utama" },
    "home.focus.metric.2.value": { en: "Software Engineer Intern", id: "Software Engineer Intern" },
    "projects.kicker": { en: "Selected Work", id: "Karya Pilihan" },
    "projects.title": { en: "Work", id: "Karya" },
    "projects.moreOn": { en: "More work on", id: "Karya lainnya di" },
    "projects.status.deployed": { en: "Deployed", id: "Sudah Deploy" },
    "projects.status.onDevelopment": { en: "On Development", id: "Dalam Pengembangan" },
    "projects.status.contributor": { en: "Contributor", id: "Kontributor" },
    "projects.status.internship": { en: "Internship Project", id: "Proyek Magang" },
    "projects.status.prototype": { en: "Prototype", id: "Prototipe" },
    "certification.kicker": { en: "Credentials", id: "Kredensial" },
    "certification.title": { en: "Certification", id: "Sertifikasi" },
    "certification.description": {
      en: "Complete record of certifications and official scores.",
      id: "Rekaman lengkap sertifikasi dan skor resmi.",
    },
    "certification.empty.title": {
      en: "No certifications added yet",
      id: "Belum ada sertifikasi ditambahkan",
    },
    "certification.empty.subtitle": {
      en: "Add your certificate list here to showcase your validated skills.",
      id: "Tambahkan daftar sertifikat kamu di sini untuk menampilkan skill yang tervalidasi.",
    },
    "contact.kicker": { en: "Let's talk", id: "Mari ngobrol" },
    "contact.title": { en: "Contact", id: "Kontak" },
    "contact.description": {
      en: "Have a question or a project in mind? Feel free to reach out.",
      id: "Punya pertanyaan atau ide proyek? Jangan ragu untuk menghubungi saya.",
    },
    "contact.locationLabel": { en: "Location:", id: "Lokasi:" },
    "contact.placeholder.name": { en: "Name", id: "Nama" },
    "contact.placeholder.email": { en: "Email", id: "Email" },
    "contact.placeholder.message": { en: "Message", id: "Pesan" },
    "contact.submit": { en: "Submit", id: "Kirim" },
    "contact.success": { en: "✅ Thank you for your message!", id: "✅ Terima kasih, pesan kamu sudah terkirim!" },
    "contact.error": {
      en: "There was a problem sending your message.",
      id: "Terjadi masalah saat mengirim pesan kamu.",
    },
    "footer.tech.builtWith": { en: "Built with", id: "Dibangun dengan" },
    "footer.tech.styledWith": { en: "Styled with", id: "Ditata dengan" },
    "footer.tech.deployedOn": { en: "Deployed on", id: "Di-deploy di" },
    "footer.rights": { en: "All rights reserved.", id: "Hak cipta dilindungi." }
  };

  console.log('Seeding initial translations if empty...');
  const [transRows] = await connection.query('SELECT COUNT(*) as count FROM site_translations');
  if (transRows[0].count === 0) {
    for (const [key, val] of Object.entries(initialTranslations)) {
      await connection.query(
        'INSERT INTO site_translations (translation_key, en, id_text) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE en = VALUES(en), id_text = VALUES(id_text)',
        [key, val.en, val.id]
      );
    }
    console.log(`Seeded ${Object.keys(initialTranslations).length} translation keys.`);
  } else {
    console.log('Translations already populated, skipping.');
  }

  await connection.end();
  console.log('Database setup completed successfully.');
}

run().catch(err => {
  console.error('Error setting up database:', err);
  process.exit(1);
});

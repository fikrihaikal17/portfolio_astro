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

  console.log('Creating portfolio_skills table...');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS portfolio_skills (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(128) NOT NULL,
      label VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      order_index INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_portfolio_skills_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const initialSkills = [
    { slug: "laravel", label: "Laravel", image_url: "/svg/laravel.svg", order_index: 0 },
    { slug: "Php_dark", label: "PHP", image_url: "/svg/Php_dark.svg", order_index: 1 },
    { slug: "react", label: "React", image_url: "/svg/react.svg", order_index: 2 },
    { slug: "javaScript", label: "JavaScript", image_url: "/svg/javaScript.svg", order_index: 3 },
    { slug: "typeScript", label: "TypeScript", image_url: "/svg/typeScript.svg", order_index: 4 },
    { slug: "tailwindcss", label: "Tailwind CSS", image_url: "/svg/tailwindcss.svg", order_index: 5 },
    { slug: "next", label: "Next.js", image_url: "/svg/next.svg", order_index: 6 },
    { slug: "python", label: "Python", image_url: "/svg/python.svg", order_index: 7 },
    { slug: "mysql", label: "MySQL", image_url: "/svg/mysql.svg", order_index: 8 },
    { slug: "git", label: "Git", image_url: "/svg/git.svg", order_index: 9 },
    { slug: "google-cloud", label: "Google Cloud", image_url: "/svg/google-cloud.svg", order_index: 10 },
    { slug: "android-icon", label: "Android", image_url: "/svg/android-icon.svg", order_index: 11 },
    { slug: "nodejs", label: "Node.js", image_url: "/svg/nodejs.svg", order_index: 12 },
    { slug: "HTML5", label: "HTML5", image_url: "/svg/HTML5.svg", order_index: 13 },
    { slug: "CSS3", label: "CSS3", image_url: "/svg/CSS3.svg", order_index: 14 },
    { slug: "astro", label: "Astro", image_url: "/svg/astro.svg", order_index: 15 },
  ];

  console.log('Seeding initial skills if empty...');
  const [skillRows] = await connection.query('SELECT COUNT(*) as count FROM portfolio_skills');
  if (skillRows[0].count === 0) {
    for (const s of initialSkills) {
      await connection.query(
        'INSERT INTO portfolio_skills (slug, label, image_url, order_index) VALUES (?, ?, ?, ?)',
        [s.slug, s.label, s.image_url, s.order_index]
      );
    }
    console.log(`Seeded ${initialSkills.length} skills.`);
  } else {
    console.log('Skills already populated, skipping.');
  }

  console.log('Adding owner_name key to site_settings if not exists...');
  await connection.query(`
    INSERT INTO site_settings (setting_key, setting_value, value_type)
    VALUES ('owner_name', 'Muhammad Fikri Haikal', 'string')
    ON DUPLICATE KEY UPDATE setting_key = setting_key
  `);
  console.log('Settings successfully seeded.');

  await connection.end();
  console.log('Skills database setup completed successfully.');
}

run().catch(err => {
  console.error('Error setting up skills database:', err);
  process.exit(1);
});

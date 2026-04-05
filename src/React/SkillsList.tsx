import { useEffect, useState } from "react";

const CategoryIcons = {
  webDevelopment: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6 text-[var(--sec)] opacity-70"
    >
      <path d="M21 3C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H21ZM20 11H4V19H20V11ZM20 5H4V9H20V5ZM11 6V8H9V6H11ZM7 6V8H5V6H7Z"></path>
    </svg>
  ),
  mobileDevelopment: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6 text-[var(--sec)] opacity-70"
    >
      <path d="M7 4V20H17V4H7ZM6 2H18C18.5523 2 19 2.44772 19 3V21C19 21.5523 18.5523 22 18 22H6C5.44772 22 5 21.5523 5 21V3C5 2.44772 5.44772 2 6 2ZM12 17C12.5523 17 13 17.4477 13 18C13 18.5523 12.5523 19 12 19C11.4477 19 11 18.5523 11 18C11 17.4477 11.4477 17 12 17Z"></path>
    </svg>
  ),
  cloudComputing: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6 text-[var(--sec)] opacity-70"
    >
      <path d="M6.5 19C4.567 19 3 17.433 3 15.5C3 13.74 4.3 12.284 5.992 12.039C6.466 9.741 8.503 8 10.944 8C13.112 8 14.96 9.374 15.664 11.299C17.514 11.464 19 12.99 19 14.882C19 16.884 17.377 18.507 15.375 18.507L6.5 19ZM15.375 17.007C16.5486 17.007 17.5 16.0556 17.5 14.882C17.5 13.7084 16.5486 12.757 15.375 12.757H14.399L14.188 11.828C13.797 10.112 12.285 8.896 10.528 8.896C8.566 8.896 6.937 10.369 6.742 12.321L6.664 13.1L5.888 13.205C4.776 13.356 3.95 14.307 3.95 15.43C3.95 16.43 4.76 17.24 5.76 17.24L15.375 17.007Z"></path>
    </svg>
  ),
  aiMlExploration: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6 text-[var(--sec)] opacity-70"
    >
      <path d="M11 2C7.13401 2 4 5.13401 4 9V11H2V13H4V15C4 18.866 7.13401 22 11 22H13C16.866 22 20 18.866 20 15V9C20 5.13401 16.866 2 13 2H11ZM6 9C6 6.23858 8.23858 4 11 4H13C15.7614 4 18 6.23858 18 9V15C18 17.7614 15.7614 20 13 20H11C8.23858 20 6 17.7614 6 15V9ZM9 10H11V14H9V10ZM13 10H15V14H13V10Z"></path>
    </svg>
  ),
  dataWorkflow: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6 text-[var(--sec)] opacity-70"
    >
      <path d="M4 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3ZM5 5V19H19V5H5ZM7 15H9V17H7V15ZM11 11H13V17H11V11ZM15 8H17V17H15V8Z"></path>
    </svg>
  ),
  mentoringDelivery: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6 text-[var(--sec)] opacity-70"
    >
      <path d="M4 5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V15C20 16.1046 19.1046 17 18 17H13.8L11 21L8.2 17H6C4.89543 17 4 16.1046 4 15V5ZM6 5V15H9.24L11 17.5143L12.76 15H18V5H6ZM8 8H16V10H8V8ZM8 11H14V13H8V11Z"></path>
    </svg>
  ),
};

type Language = "en" | "id";

const textMap = {
  heading: {
    en: "What I Do",
    id: "Yang Saya Kerjakan",
  },
  categories: {
    webDevelopment: {
      en: "Backend & Frontend Engineering",
      id: "Rekayasa Backend & Frontend",
    },
    mobileDevelopment: {
      en: "IoT Prototyping & Robotics",
      id: "Prototipe IoT & Robotika",
    },
    cloudComputing: {
      en: "Cloud Computing",
      id: "Cloud Computing",
    },
    aiMlExploration: {
      en: "AI/ML Exploration",
      id: "Eksplorasi AI/ML",
    },
    dataWorkflow: {
      en: "Data Workflow & Visualization",
      id: "Alur Data & Visualisasi",
    },
    mentoringDelivery: {
      en: "Mentoring & Delivery",
      id: "Mentoring & Delivery",
    },
  },
  skills: {
    webDevelopment: {
      en: [
        "Build production-ready web apps using Laravel, PHP, and JavaScript",
        "Develop and maintain core features for projects like Niskala and KWS",
        "Design full user flows from admin data handling to public-facing interfaces",
        "Create performant portfolio and business websites with responsive UX",
      ],
      id: [
        "Membangun web app siap produksi menggunakan Laravel, PHP, dan JavaScript",
        "Mengembangkan dan memelihara fitur inti untuk proyek seperti Niskala dan KWS",
        "Merancang alur pengguna end-to-end dari pengelolaan data admin hingga antarmuka publik",
        "Membuat website portofolio dan bisnis yang performa tinggi serta responsif",
      ],
    },
    mobileDevelopment: {
      en: [
        "Build Arduino-based prototypes including smart automatic trash bin systems",
        "Integrate ultrasonic sensors, servo motors, and real-time control logic",
        "Develop robotic car prototypes with practical hardware-software integration",
        "Support Robotics & IoT training and mentoring for students and teachers",
      ],
      id: [
        "Membangun prototipe berbasis Arduino termasuk sistem tong sampah otomatis",
        "Mengintegrasikan sensor ultrasonik, servo motor, dan logika kontrol real-time",
        "Mengembangkan prototipe mobil robot dengan integrasi hardware-software yang praktis",
        "Mendukung pelatihan serta mentoring Robotika & IoT untuk siswa dan guru",
      ],
    },
    cloudComputing: {
      en: [
        "Apply AWS and GCP fundamentals for scalable web and learning projects",
        "Understand basic deployment flow, hosting choices, and cloud service integration",
        "Build cloud-ready project structures with maintainable configuration practices",
        "Use cloud knowledge to support application reliability and growth",
      ],
      id: [
        "Menerapkan fondasi AWS dan GCP untuk proyek web serta pembelajaran yang skalabel",
        "Memahami alur deployment dasar, pilihan hosting, dan integrasi layanan cloud",
        "Membangun struktur proyek cloud-ready dengan praktik konfigurasi yang maintainable",
        "Menggunakan pemahaman cloud untuk mendukung reliabilitas dan pertumbuhan aplikasi",
      ],
    },
    aiMlExploration: {
      en: [
        "Explore AI/ML model experimentation using Python in Jupyter Notebook",
        "Prototype practical AI features for education and productivity use cases",
        "Understand model iteration workflow from preprocessing to evaluation",
        "Document experiment outcomes and next improvements for iterative development",
      ],
      id: [
        "Mengeksplorasi eksperimen model AI/ML menggunakan Python di Jupyter Notebook",
        "Membuat prototipe fitur AI praktis untuk use case edukasi dan produktivitas",
        "Memahami alur iterasi model dari preprocessing hingga evaluasi",
        "Mendokumentasikan hasil eksperimen dan perbaikan berikutnya secara iteratif",
      ],
    },
    dataWorkflow: {
      en: [
        "Process training and project data into structured, usable information",
        "Create clear visual summaries to support mentoring and technical decisions",
        "Track participant and program data for more effective execution",
        "Translate raw data into practical insights for project improvement",
      ],
      id: [
        "Mengolah data pelatihan dan proyek menjadi informasi yang terstruktur serta siap pakai",
        "Membuat ringkasan visual yang jelas untuk mendukung mentoring dan keputusan teknis",
        "Melacak data peserta dan data program agar eksekusi lebih efektif",
        "Menerjemahkan data mentah menjadi insight praktis untuk peningkatan proyek",
      ],
    },
    mentoringDelivery: {
      en: [
        "Facilitate coding, robotics, and AI mentoring sessions for teachers and students",
        "Manage participant data and program workflows for smoother training execution",
        "Prepare and print learning modules to support technical classes and workshops",
        "Coordinate with cross-functional teams to deliver practical and measurable outcomes",
      ],
      id: [
        "Memfasilitasi sesi mentoring coding, robotika, dan AI untuk guru serta siswa",
        "Mengelola data peserta dan alur program agar pelaksanaan pelatihan lebih terstruktur",
        "Menyiapkan dan mencetak modul pembelajaran untuk mendukung kelas serta workshop teknis",
        "Berkoordinasi dengan tim lintas fungsi untuk menghasilkan output yang praktis dan terukur",
      ],
    },
  },
};

const categories = [
  "webDevelopment",
  "mobileDevelopment",
  "cloudComputing",
  "aiMlExploration",
  "dataWorkflow",
  "mentoringDelivery",
] as const;
type CategoryKey = (typeof categories)[number];

const SkillsList = () => {
  const [openItem, setOpenItem] = useState<CategoryKey | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof document === "undefined") {
      return "en";
    }
    return document.documentElement.lang === "id" ? "id" : "en";
  });

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ language?: Language }>;
      const nextLanguage = customEvent.detail?.language;
      if (nextLanguage === "id" || nextLanguage === "en") {
        setLanguage(nextLanguage);
      }
    };

    window.addEventListener("portfolio:language-change", handler);
    return () => {
      window.removeEventListener("portfolio:language-change", handler);
    };
  }, []);

  const toggleItem = (item: CategoryKey) => {
    setOpenItem(openItem === item ? null : item);
  };

  return (
    <div className="text-left pt-0 md:pt-0">
      <h3 className="text-[var(--white)] text-3xl md:text-4xl font-semibold mb-2 md:mb-3 leading-tight">
        {textMap.heading[language]}
      </h3>
      <ul className="space-y-4 mt-0 md:mt-1 text-lg">
        {categories.map((category) => (
          <li key={category} className="w-full">
            <div
              onClick={() => toggleItem(category)}
              className="md:w-[400px] w-full bg-[var(--component-bg)] rounded-2xl text-left hover:bg-opacity-80 transition-all border border-[var(--white-icon-tr)] cursor-pointer overflow-hidden"
            >
              <div className="flex items-center gap-3 p-4">
                {CategoryIcons[category]}
                <div className="flex items-center gap-2 flex-grow justify-between">
                  <div className="min-w-0 max-w-[200px] md:max-w-none overflow-hidden">
                    <span className="block truncate text-[var(--white)] text-lg">
                      {textMap.categories[category][language]}
                    </span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={`w-6 h-6 text-[var(--white)] transform transition-transform flex-shrink-0 ${
                      openItem === category ? "rotate-180" : ""
                    }`}
                  >
                    <path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z"></path>
                  </svg>
                </div>
              </div>

              <div
                className={`transition-all duration-300 px-4 ${
                  openItem === category
                    ? "max-h-[500px] pb-4 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <ul className="space-y-2 text-[var(--white-icon)] text-sm">
                  {textMap.skills[category][language].map((item, index) => (
                    <div key={index} className="flex items-center">
                      <span className="pl-1">•</span>
                      <li className="pl-3">{item}</li>
                    </div>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SkillsList;

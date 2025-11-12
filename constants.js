// constants.js - shared configuration defaults

export const DEFAULT_CONFIG = {
  locationKeywords: ["new york", "nyc", "remote"],
  jobDescKeywords: ["position", "role", "responsibility", "requirement", "job"],
  salaryKeywords: ["salary", "range", "compensation", "pay", "rate"],
  replies: {
    locationFilter: "NYC or REMOTE only.",
    salaryInquiry: "What is the salary range?",
    missingJobDesc: "Please share the job description and salary range.",
    fallback: "Thanks for reaching out. Could you share the job description and salary range?",
  },
  templates: [
    { title: "JD & Salary?", content: "Thanks for reaching out. Could you please share the job description and salary range?" },
    { title: "Salary range?", content: "What is the salary range for this position?" },
    { title: "Remote?", content: "Is this a remote position?" },
    { title: "Email", content: "Looking.For.The.Best.Job@gmail.com" },
    { title: "Online Resume", content: "Download my updated resume here: https://tinyurl.com/alex-online-resume" },

    { title: "Targeting $100/h on W2", content: "Targeting $100/h on W2" },
    { title: "Targeting 200K", content: "Targeting 200K" },

    { title: "No Java", content: "No Java experience yet" },
    { title: "NYC/Remote Only", content: "Thanks! I am currently considering roles in NYC or fully remote only." },
    { title: "Manhattan or Brooklyn only", content: "Manhattan or Brooklyn only" },

    { title: "What is the next step?", content: "Thanks,\n Sounds good.\n What is the next step?" },
  ],
  autoSend: false,
  useAI: false,
  aiApiKey: "",
};

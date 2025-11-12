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
  autoSend: false,
  useAI: false,
  aiApiKey: "",
};

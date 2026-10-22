// background.js - service worker

// Shared defaults
import { DEFAULT_CONFIG } from './constants.js';

// Storage helpers
async function getConfig() {
  const data = await chrome.storage.local.get(["config"]);
  return { ...DEFAULT_CONFIG, ...(data.config || {}) };
}

async function setConfig(config) {
  await chrome.storage.local.set({ config });
}

// Simple rules engine
function evaluateRules(text, config) {
  const t = String(text || "").toLowerCase();
  const has = (arr) => (arr || []).some((k) => t.includes(String(k).toLowerCase()));

  const hasLocation = has(config.locationKeywords);
  const hasJobDesc = has(config.jobDescKeywords);
  const hasSalary = has(config.salaryKeywords);

  // Rule 1: Location Filter
  if (!hasLocation) {
    return { rule: "locationFilter", reply: config.replies.locationFilter };
  }

  // Rule 2: Missing Job Description
  if (!hasJobDesc) {
    return { rule: "missingJobDesc", reply: config.replies.missingJobDesc };
  }

  // Rule 3: Salary Inquiry when JD exists but no salary
  if (!hasSalary) {
    return { rule: "salaryInquiry", reply: config.replies.salaryInquiry };
  }

  // Fallback or AI
  return { rule: "fallback", reply: config.replies.fallback };
}

function canUseAI(config) {
  return !!(config?.useAI && String(config?.aiApiKey || "").trim());
}

function pickRelevantTemplates(messageText, templates, limit = 5) {
  const list = Array.isArray(templates) ? templates : [];
  const text = String(messageText || "").toLowerCase();

  const scored = list
    .filter((t) => t?.content)
    .map((t) => {
      const title = String(t.title || "");
      const content = String(t.content || "");
      const bag = `${title} ${content}`.toLowerCase();
      const words = Array.from(new Set(bag.split(/[^a-z0-9$]+/).filter((w) => w.length > 2)));
      const overlap = words.reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0);
      return { title, content, score: overlap };
    })
    .sort((a, b) => b.score - a.score || b.content.length - a.content.length);

  return scored.slice(0, limit).map(({ title, content }) => ({ title, content }));
}

function buildRulesSummary(config) {
  return [
    `1) locationFilter -> ${config?.replies?.locationFilter || ""}`,
    `2) missingJobDesc -> ${config?.replies?.missingJobDesc || ""}`,
    `3) salaryInquiry -> ${config?.replies?.salaryInquiry || ""}`,
    `4) fallback -> ${config?.replies?.fallback || ""}`,
  ].join("\n");
}

function sanitizeReply(text, fallback) {
  const cleaned = String(text || "")
    .replace(/^```[a-z]*\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return cleaned || fallback;
}

async function requestAIReply({ content, meta, baseProposal, config }) {
  const model = String(config?.aiModel || "gpt-4o-mini").trim() || "gpt-4o-mini";
  const relevantTemplates = pickRelevantTemplates(content, config?.templates);
  const templatesText = relevantTemplates.length
    ? relevantTemplates.map((t, idx) => `${idx + 1}. ${t.title || "Untitled"}: ${t.content}`).join("\n")
    : "No templates provided.";

  const systemPrompt = [
    "You write short, professional LinkedIn replies for a job seeker.",
    "Always follow the selected rule intent.",
    "Use templates only when relevant.",
    "Return only the reply text. No markdown, no quotes.",
    "Keep under 2 short sentences.",
  ].join(" ");

  const userPrompt = [
    `Incoming message meta: ${meta || "N/A"}`,
    `Incoming message content: ${content || ""}`,
    `Selected rule: ${baseProposal.rule}`,
    `Rule-based draft: ${baseProposal.reply}`,
    "Rules summary:",
    buildRulesSummary(config),
    "Available templates:",
    templatesText,
    "Write the final reply now.",
  ].join("\n\n");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${String(config.aiApiKey).trim()}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`AI HTTP ${response.status}: ${details.slice(0, 300)}`);
    }

    const data = await response.json();
    const aiText = data?.choices?.[0]?.message?.content;
    return sanitizeReply(aiText, baseProposal.reply);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function buildProposal({ content, meta, config }) {
  const baseProposal = evaluateRules(content, config);
  if (!canUseAI(config)) {
    return { ...baseProposal, source: "rules" };
  }

  try {
    const aiReply = await requestAIReply({ content, meta, baseProposal, config });
    return {
      rule: "aiEnhanced",
      baseRule: baseProposal.rule,
      reply: aiReply,
      source: "ai",
    };
  } catch (_error) {
    return { ...baseProposal, source: "rules" };
  }
}

// Last proposal cache per tabId
const lastProposals = new Map(); // tabId -> { messageMeta, messageContent, proposal, timestamp }
const PROPOSAL_TTL_MS = 5 * 60 * 1000;
const MAX_PROPOSALS = 100;

function cleanupProposals(now = Date.now()) {
  for (const [key, value] of lastProposals.entries()) {
    if (!value?.timestamp || now - value.timestamp > PROPOSAL_TTL_MS) {
      lastProposals.delete(key);
    }
  }

  if (lastProposals.size <= MAX_PROPOSALS) return;

  const sortedByAge = Array.from(lastProposals.entries())
    .sort((a, b) => (a[1]?.timestamp || 0) - (b[1]?.timestamp || 0));

  const toTrim = sortedByAge.length - MAX_PROPOSALS;
  for (let i = 0; i < toTrim; i++) {
    lastProposals.delete(sortedByAge[i][0]);
  }
}

function normalizeIncomingMessage(msg) {
  return {
    meta: msg.meta || "",
    content: msg.content || msg.text || "",
  };
}

function mergeConfig(override = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...override,
    replies: {
      ...DEFAULT_CONFIG.replies,
      ...(override.replies || {}),
    },
  };
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    const tabId = sender.tab?.id || msg.tabId;
    cleanupProposals();

    if (msg.type === "NEW_INCOMING_MESSAGE") {
      if (!tabId) {
        sendResponse({ ok: false, error: "Missing tabId" });
        return;
      }

      const config = await getConfig();
      const { meta, content } = normalizeIncomingMessage(msg);
      const proposal = await buildProposal({ content, meta, config });
      lastProposals.set(tabId, {
        messageMeta: meta,
        messageContent: content,
        proposal,
        timestamp: Date.now(),
      });
      await chrome.storage.local.set({ lastProposalsSnapshot: Object.fromEntries(lastProposals) });

      // Auto-send if enabled
      if (config.autoSend) {
        chrome.tabs.sendMessage(tabId, { type: "SEND_REPLY", text: proposal.reply });
      }
      sendResponse({ ok: true, proposal });
      return;
    }

    if (msg.type === "GET_LAST_PROPOSAL") {
      const entry = lastProposals.get(tabId);
      sendResponse({ ok: !!entry, data: entry || null });
      return;
    }

    if (msg.type === "RUN_RULES_ON_TEXT") {
      const config = await getConfig();
      const proposal = await buildProposal({
        content: msg.text || "",
        meta: msg.meta || "",
        config,
      });
      if (tabId) {
        lastProposals.set(tabId, {
          messageMeta: "",
          messageContent: msg.text || "",
          proposal,
          timestamp: Date.now(),
        });
      }
      sendResponse({ ok: true, proposal });
      return;
    }

    if (msg.type === "TEST_AI_REPLY") {
      const config = mergeConfig(msg.config || (await getConfig()));
      const proposal = await buildProposal({
        content: msg.text || "",
        meta: msg.meta || "",
        config,
      });
      sendResponse({ ok: true, proposal });
      return;
    }

    if (msg.type === "SEND_REPLY_NOW") {
      if (tabId && msg.text) {
        chrome.tabs.sendMessage(tabId, { type: "SEND_REPLY", text: msg.text });
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false, error: "Missing tabId or text" });
      }
      return;
    }

    if (msg.type === "GET_CONFIG") {
      sendResponse({ ok: true, config: await getConfig() });
      return;
    }

    if (msg.type === "SET_CONFIG") {
      await setConfig(msg.config || {});
      sendResponse({ ok: true });
    }
  })();

  // Keep the message channel open for async
  return true;
});

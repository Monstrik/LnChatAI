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
  const t = text.toLowerCase();
  const has = (arr) => arr.some((k) => t.includes(k));

  const hasLocation = has(config.locationKeywords);
  const hasJobDesc = has(config.jobDescKeywords);
  const hasSalary = has(config.salaryKeywords);

  // Rule 1: Location Filter
  if (!hasLocation) {
    return { rule: "locationFilter", reply: config.replies.locationFilter };
  }

  // Rule 2: Salary Inquiry when JD exists but no salary
  if (hasJobDesc && !hasSalary) {
    return { rule: "salaryInquiry", reply: config.replies.salaryInquiry };
  }

  // Rule 3: Missing Job Description
  if (!hasJobDesc) {
    return { rule: "missingJobDesc", reply: config.replies.missingJobDesc };
  }

  // Fallback or AI
  return { rule: "fallback", reply: config.replies.fallback };
}

// Last proposal cache per tabId
const lastProposals = new Map(); // tabId -> { messageText, proposal, timestamp }


console.log("My EXT init");

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    const tabId = sender.tab?.id || msg.tabId;
    console.log('[LIM]', msg.type);

    if (msg.type === "NEW_INCOMING_MESSAGE") {
      const config = await getConfig();
      const meta = msg.meta || "";
      const content = msg.content || msg.text || ""; // fallback to text for backward compatibility
      const proposal = evaluateRules(content, config);
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
      const proposal = evaluateRules(msg.text || "", config);
      if (tabId) {
        lastProposals.set(tabId, { messageText: msg.text || "", proposal, timestamp: Date.now() });
      }
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
      return;
    }
  })();

  // Keep the message channel open for async
  return true;
});

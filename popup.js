// popup.js - UI logic for approval and send

function qs(sel) { return document.querySelector(sel); }

function setStatus(msg, ok=true) {
  const el = qs('#status');
  el.textContent = msg || '';
  el.className = ok ? 'small ok' : 'small err';
}

let templatesCache = [];

async function getActiveTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id;
}

function populateTemplateSelect(templates) {
  const sel = qs('#templateSelect');
  if (!sel) return;
  // Clear, keep placeholder
  sel.innerHTML = '<option value="">Choose template…</option>';
  (templates || []).forEach((t, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = t.title || `Template ${idx+1}`;
    sel.appendChild(opt);
  });
}

async function refreshFromPage() {
  setStatus('Refreshing from page...');
  const tabId = await getActiveTabId();
  if (!tabId) return setStatus('No active tab', false);
  try {
    const res = await chrome.tabs.sendMessage(tabId, { type: 'GET_LATEST_INCOMING' });
    if (res?.ok) {
      qs('#incomingMeta').value = res.meta || '';
      qs('#incomingContent').value = res.content || '';
      // ask background to propose using content only
      const proposal = await chrome.runtime.sendMessage({ type: 'RUN_RULES_ON_TEXT', text: res.content || '', tabId });
      if (proposal?.ok) {
        qs('#reply').value = proposal.proposal.reply;
        qs('#ruleNote').textContent = `Rule: ${proposal.proposal.rule}`;
        setStatus('Proposed via rules', true);
      } else {
        setStatus('Rules failed', false);
      }
    } else {
      setStatus(res?.error || 'Unable to read message from page', false);
    }
  } catch (e) {
    setStatus('Please open a LinkedIn conversation tab and reload popup.', false);
  }
}

async function loadLastProposal() {
  const tabId = await getActiveTabId();
  if (!tabId) return;
  const res = await chrome.runtime.sendMessage({ type: 'GET_LAST_PROPOSAL', tabId });
  if (res?.ok && res.data) {
    // Support both new and old cache shapes
    const meta = res.data.messageMeta ?? '';
    const content = res.data.messageContent ?? res.data.messageText ?? '';
    qs('#incomingMeta').value = meta;
    qs('#incomingContent').value = content;
    qs('#reply').value = res.data.proposal?.reply || '';
    qs('#ruleNote').textContent = `Rule: ${res.data.proposal?.rule}`;
    setStatus('Loaded last proposal');
  }
}

async function loadConfig() {
  const res = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });
  const cfg = res?.config;
  if (cfg) {
    qs('#autoSendToggle').checked = !!cfg.autoSend;
    templatesCache = Array.isArray(cfg.templates) ? cfg.templates : [];
    populateTemplateSelect(templatesCache);
  }
}

async function saveAutoSend(v) {
  const res = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });
  const cfg = res?.config || {};
  cfg.autoSend = v;
  await chrome.runtime.sendMessage({ type: 'SET_CONFIG', config: cfg });
  setStatus(v ? 'Auto-send enabled' : 'Auto-send disabled');
}

async function runRules() {
  const text = qs('#incomingContent').value.trim();
  if (!text) return setStatus('No message content found', false);
  const tabId = await getActiveTabId();
  const res = await chrome.runtime.sendMessage({ type: 'RUN_RULES_ON_TEXT', text, tabId });
  if (res?.ok) {
    qs('#reply').value = res.proposal.reply || '';
    qs('#ruleNote').textContent = `Rule: ${res.proposal.rule}`;
    setStatus('Rules applied');
  } else {
    setStatus('Failed to run rules', false);
  }
}

async function approveAndSend() {
  const tabId = await getActiveTabId();
  const text = qs('#reply').value.trim();
  if (!text) return setStatus('Reply is empty', false);
  const res = await chrome.runtime.sendMessage({ type: 'SEND_REPLY_NOW', text, tabId });
  setStatus(res?.ok ? 'Sent' : 'Failed to send', !!res?.ok);
}

async function sendNowNoConfirm() {
  // Run rules on current incoming content and send immediately
  const tabId = await getActiveTabId();
  const incoming = qs('#incomingContent').value.trim();
  if (!incoming) return setStatus('No message content to process', false);
  const proposal = await chrome.runtime.sendMessage({ type: 'RUN_RULES_ON_TEXT', text: incoming, tabId });
  if (proposal?.ok) {
    const res = await chrome.runtime.sendMessage({ type: 'SEND_REPLY_NOW', text: proposal.proposal.reply, tabId });
    setStatus(res?.ok ? `Sent via rule: ${proposal.proposal.rule}` : 'Failed to send', !!res?.ok);
  } else {
    setStatus('Rules failed', false);
  }
}

function insertSelectedTemplate() {
  const sel = qs('#templateSelect');
  if (!sel) return;
  const idx = parseInt(sel.value, 10);
  if (Number.isNaN(idx)) return;
  const tpl = templatesCache[idx];
  if (!tpl) return;
  const area = qs('#reply');
  area.value = tpl.content || '';
  setStatus(tpl.title ? `Template applied: ${tpl.title}` : 'Template applied');
}

// Wire up events
window.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  await loadLastProposal();

  qs('#refresh').addEventListener('click', refreshFromPage);
  qs('#propose').addEventListener('click', runRules);
  qs('#approveSend').addEventListener('click', approveAndSend);
  qs('#sendNow').addEventListener('click', sendNowNoConfirm);
  qs('#autoSendToggle').addEventListener('change', (e) => saveAutoSend(e.target.checked));
  const selTpl = qs('#templateSelect');
  if (selTpl) selTpl.addEventListener('change', insertSelectedTemplate);
});

// options.js - manage configuration

import { DEFAULT_CONFIG } from './constants.js';

function qs(id) { return document.getElementById(id); }
function setStatus(msg, ok = true) {
  const el = document.getElementById('status');
  el.textContent = msg || '';
  el.className = ok ? 'small ok' : 'small err';
}

function setAiLastError(msg) {
  const el = qs('aiLastError');
  if (!el) return;
  el.textContent = msg || '';
}

function initTabs() {
  const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
  const tabPanels = Array.from(document.querySelectorAll('.tab-panel'));
  if (!tabButtons.length || !tabPanels.length) return;

  function setActive(tabId) {
    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    tabPanels.forEach((panel) => {
      const isActive = panel.id === tabId;
      panel.hidden = !isActive;
      panel.classList.toggle('is-active', isActive);
    });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => setActive(btn.dataset.tab));
  });

  const initial = tabButtons.find((btn) => btn.classList.contains('is-active'));
  setActive(initial?.dataset.tab || tabButtons[0].dataset.tab);
}

async function getConfig() {
  const res = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });
  return res?.config ? { ...DEFAULT_CONFIG, ...res.config } : DEFAULT_CONFIG;
}

async function setConfig(config) {
  await chrome.runtime.sendMessage({ type: 'SET_CONFIG', config });
}

function arrToStr(arr) { return (arr || []).join(', '); }
function strToArr(str) { return (str || '').split(',').map(s => s.trim()).filter(Boolean); }

function renderTemplates(templates) {
  const container = qs('templates');
  if (!container) return;
  container.innerHTML = '';
  const list = Array.isArray(templates) ? templates : [];
  list.forEach((t, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'template-item';

    const titleLabel = document.createElement('label');
    titleLabel.textContent = 'Title';
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = t.title || '';
    titleInput.dataset.idx = idx;
    titleInput.className = 'tpl-title';

    const contentLabel = document.createElement('label');
    contentLabel.textContent = 'Content';
    contentLabel.className = 'template-content-label';
    const contentArea = document.createElement('textarea');
    contentArea.value = t.content || '';
    contentArea.dataset.idx = idx;
    contentArea.className = 'tpl-content';

    const row = document.createElement('div');
    row.className = 'template-actions';
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'btn-template-remove';
    removeBtn.addEventListener('click', async () => {
      const cfg = await getConfig();
      const arr = Array.isArray(cfg.templates) ? cfg.templates.slice() : [];
      arr.splice(idx, 1);
      cfg.templates = arr;
      await setConfig(cfg);
      renderTemplates(cfg.templates);
      setStatus('Template removed');
    });

    row.appendChild(removeBtn);

    wrap.appendChild(titleLabel);
    wrap.appendChild(titleInput);
    wrap.appendChild(contentLabel);
    wrap.appendChild(contentArea);
    wrap.appendChild(row);

    container.appendChild(wrap);
  });
}

async function load() {
  const cfg = await getConfig();
  qs('locationKeywords').value = arrToStr(cfg.locationKeywords);
  qs('jobDescKeywords').value = arrToStr(cfg.jobDescKeywords);
  qs('salaryKeywords').value = arrToStr(cfg.salaryKeywords);

  qs('replyLocation').value = cfg.replies.locationFilter;
  qs('replySalary').value = cfg.replies.salaryInquiry;
  qs('replyMissing').value = cfg.replies.missingJobDesc;
  qs('replyFallback').value = cfg.replies.fallback;

  renderTemplates(cfg.templates || []);

  qs('useAI').checked = !!cfg.useAI;
  qs('aiApiKey').value = cfg.aiApiKey || '';
  qs('aiModel').value = cfg.aiModel || 'gpt-4o-mini';
  qs('autoSend').checked = !!cfg.autoSend;
}

function collectConfigFromForm(baseConfig) {
  const cfg = { ...baseConfig };
  cfg.locationKeywords = strToArr(qs('locationKeywords').value);
  cfg.jobDescKeywords = strToArr(qs('jobDescKeywords').value);
  cfg.salaryKeywords = strToArr(qs('salaryKeywords').value);

  cfg.replies = {
    ...(cfg.replies || {}),
    locationFilter: qs('replyLocation').value.trim(),
    salaryInquiry: qs('replySalary').value.trim(),
    missingJobDesc: qs('replyMissing').value.trim(),
    fallback: qs('replyFallback').value.trim(),
  };

  const titles = Array.from(document.querySelectorAll('.tpl-title'));
  const contents = Array.from(document.querySelectorAll('.tpl-content'));
  cfg.templates = titles.map((input, i) => ({
    title: input.value.trim(),
    content: (contents[i]?.value || '').trim(),
  })).filter(t => t.title || t.content);

  cfg.useAI = qs('useAI').checked;
  cfg.aiApiKey = qs('aiApiKey').value.trim();
  cfg.aiModel = qs('aiModel').value.trim() || 'gpt-4o-mini';
  cfg.autoSend = qs('autoSend').checked;

  return cfg;
}

async function save() {
  const cfg = collectConfigFromForm(await getConfig());

  await setConfig(cfg);
  setStatus('Saved');
}

async function testAIReply() {
  const input = qs('aiTestInput')?.value.trim();
  const output = qs('aiTestOutput');
  if (!input) {
    setStatus('Enter a test message first', false);
    setAiLastError('');
    if (output) output.value = '';
    return;
  }

  const cfg = collectConfigFromForm(await getConfig());
  if (!cfg.useAI) {
    setStatus('Enable AI first to run a live test', false);
    setAiLastError('');
    if (output) {
      output.value = [
        'AI test did not run.',
        'How to fix:',
        '1) Open AI and Behavior tab',
        '2) Turn on "Use AI to enhance proposed replies"',
        '3) Click Save, then run the test again',
      ].join('\n');
    }
    return;
  }

  if (!cfg.aiApiKey) {
    setStatus('Missing API key', false);
    setAiLastError('');
    if (output) {
      output.value = [
        'AI test did not run because no API key is set.',
        'How to fix:',
        '1) Create a key at https://platform.openai.com/api-keys',
        '2) Paste it into AI API Key',
        '3) Click Save, then run the test again',
      ].join('\n');
    }
    return;
  }

  const button = qs('testAI');
  if (button) button.disabled = true;
  if (output) output.value = 'Generating...';

  try {
    const res = await chrome.runtime.sendMessage({
      type: 'TEST_AI_REPLY',
      text: input,
      meta: 'Manual options test',
      config: cfg,
    });

    if (!res?.ok) {
      if (output) output.value = '';
      setAiLastError('');
      setStatus(res?.error || 'AI test failed', false);
      return;
    }

    if (output) output.value = res.proposal?.reply || '';
    const mode = res.proposal?.rule === 'aiEnhanced'
      ? `AI test OK (${res.proposal?.baseRule || 'fallback'})`
      : `AI fallback to rules (${res.proposal?.rule || 'fallback'})`;
    if (res.proposal?.aiError) {
      setAiLastError(`Last AI error: ${res.proposal.aiError}`);
      setStatus(`AI fallback: ${res.proposal.aiError}`, false);
    } else {
      setAiLastError('');
      setStatus(mode);
    }
  } catch (_error) {
    if (output) output.value = '';
    setAiLastError('');
    setStatus('AI test failed', false);
  } finally {
    if (button) button.disabled = false;
  }
}

async function resetDefaults() {
  await setConfig(DEFAULT_CONFIG);
  await load();
  setStatus('Reset to defaults');
}

async function addTemplate() {
  const cfg = await getConfig();
  const list = Array.isArray(cfg.templates) ? cfg.templates.slice() : [];
  list.push({ title: '', content: '' });
  cfg.templates = list;
  await setConfig(cfg);
  renderTemplates(cfg.templates);
}

window.addEventListener('DOMContentLoaded', () => {
  initTabs();
  load();
  document.getElementById('save').addEventListener('click', save);
  document.getElementById('reset').addEventListener('click', resetDefaults);
  const addBtn = document.getElementById('addTemplate');
  if (addBtn) addBtn.addEventListener('click', addTemplate);
  const testAIBtn = document.getElementById('testAI');
  if (testAIBtn) testAIBtn.addEventListener('click', testAIReply);
});

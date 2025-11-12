// options.js - manage configuration

import { DEFAULT_CONFIG } from './constants.js';

function qs(id) { return document.getElementById(id); }
function setStatus(msg) { document.getElementById('status').textContent = msg || ''; }

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
    wrap.style.border = '1px solid var(--border)';
    wrap.style.padding = '8px';
    wrap.style.borderRadius = '6px';
    wrap.style.marginTop = '8px';

    const titleLabel = document.createElement('label');
    titleLabel.textContent = 'Title';
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = t.title || '';
    titleInput.dataset.idx = idx;
    titleInput.className = 'tpl-title';

    const contentLabel = document.createElement('label');
    contentLabel.textContent = 'Content';
    contentLabel.style.marginTop = '6px';
    const contentArea = document.createElement('textarea');
    contentArea.value = t.content || '';
    contentArea.dataset.idx = idx;
    contentArea.className = 'tpl-content';

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '8px';
    row.style.marginTop = '6px';
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
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
  qs('autoSend').checked = !!cfg.autoSend;
}

async function save() {
  const cfg = await getConfig();
  cfg.locationKeywords = strToArr(qs('locationKeywords').value);
  cfg.jobDescKeywords = strToArr(qs('jobDescKeywords').value);
  cfg.salaryKeywords = strToArr(qs('salaryKeywords').value);

  cfg.replies.locationFilter = qs('replyLocation').value.trim();
  cfg.replies.salaryInquiry = qs('replySalary').value.trim();
  cfg.replies.missingJobDesc = qs('replyMissing').value.trim();
  cfg.replies.fallback = qs('replyFallback').value.trim();

  // Collect templates from UI
  const titles = Array.from(document.querySelectorAll('.tpl-title'));
  const contents = Array.from(document.querySelectorAll('.tpl-content'));
  const templates = titles.map((input, i) => ({
    title: input.value.trim(),
    content: (contents[i]?.value || '').trim(),
  })).filter(t => t.title || t.content);
  cfg.templates = templates;

  cfg.useAI = qs('useAI').checked;
  cfg.aiApiKey = qs('aiApiKey').value.trim();
  cfg.autoSend = qs('autoSend').checked;

  await setConfig(cfg);
  setStatus('Saved');
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
  load();
  document.getElementById('save').addEventListener('click', save);
  document.getElementById('reset').addEventListener('click', resetDefaults);
  const addBtn = document.getElementById('addTemplate');
  if (addBtn) addBtn.addEventListener('click', addTemplate);
});

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

async function load() {
  const cfg = await getConfig();
  qs('locationKeywords').value = arrToStr(cfg.locationKeywords);
  qs('jobDescKeywords').value = arrToStr(cfg.jobDescKeywords);
  qs('salaryKeywords').value = arrToStr(cfg.salaryKeywords);

  qs('replyLocation').value = cfg.replies.locationFilter;
  qs('replySalary').value = cfg.replies.salaryInquiry;
  qs('replyMissing').value = cfg.replies.missingJobDesc;
  qs('replyFallback').value = cfg.replies.fallback;

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

window.addEventListener('DOMContentLoaded', () => {
  load();
  document.getElementById('save').addEventListener('click', save);
  document.getElementById('reset').addEventListener('click', resetDefaults);
});

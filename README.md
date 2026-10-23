# LnChatAI — LinkedIn Auto‑Responder (Chrome Extension)

LnChatAI helps you triage and reply to LinkedIn messages quickly. It reads the latest incoming message, applies clear rules to propose a reply, and can either ask for your approval or send immediately.

- Works on both the full Messaging page and the mini messages overlay
- Shows message Meta and Content separately (extracted from the exact nodes you requested)
- Two send flows: Approve & Send, or Run Rule & Send (no confirmation)
- Optional Auto‑send for fully hands‑free replies
- Optional AI-enhanced reply generation that uses your rules + saved templates
- Dark mode UI with accessible colors
- All keywords and reply texts are configurable in Options


## Quick start (Developer Mode)
1. Open Chrome and go to `chrome://extensions`.
2. Enable "Developer mode" (top right).
3. Click "Load unpacked" and select this project folder (the one containing `manifest.json`).
4. Pin the extension icon for quick access.


## Using the extension
1. Open a LinkedIn conversation (e.g., `https://www.linkedin.com/messaging/...`) or open the mini chat overlay on any LinkedIn page.
2. Click the extension icon to open the popup.
3. Click Refresh to fetch the latest incoming message from the current tab.
4. Click Run Rules to see the proposed reply and which rule fired.
5. Choose a send flow:
   - Approve & Send — sends the text visible in the Proposed Reply field.
   - Run Rule & Send (no confirm) — re‑evaluates the current message and sends immediately.
6. Optionally enable Auto‑send to automatically reply on each new incoming message.

The popup displays two read‑only fields:
- Meta (sender/time) — from `div.msg-s-message-group__meta`
- Content (message text) — from `div.msg-s-event__content`


## Rules (default)
1) Location filter
- If the message does NOT mention any of: "New York", "NYC", or "Remote"
- Reply: `NYC or REMOTE only.`

2) Salary inquiry (JD present, no salary)
- If the message contains job description keywords: `position`, `role`, `responsibility`, `requirement`, `job`
- AND it contains no salary keywords: `salary`, `range`, `compensation`, `pay`, `rate`
- Reply: `What is the salary range?`

3) Missing job description
- If the message does not contain job description keywords
- Reply: `Please share the job description and salary range.`

Fallback
- If none of the above apply, a polite fallback asks for JD and salary range.

All keywords and reply texts can be edited on the Options page.


## Options
Open Options via the popup link or by right‑clicking the extension icon → Options. You can configure:
- Keywords: location, job description, salary
- Replies: for each rule and the fallback
- Behavior: Auto‑send on/off
- AI: enable flag + API key + model name (default: `gpt-4o-mini`)
- AI test box in Options to run a sample message before sending real replies

When AI is enabled, LnChatAI:
- Runs the normal rule engine first
- Sends the selected rule, default reply, and relevant templates to the AI model
- Uses the AI result as the final proposed reply
- Falls back to the rule-based reply if the AI request fails or times out


## Architecture overview
- Manifest V3 service worker (`background.js`, ESM) — holds the rules engine, config access, and messaging between popup and page.
- Content script (`contentScript.js`) — extracts the latest incoming message and can send replies. Supports both the full messaging page and the mini overlay.
- Popup (`popup.html`, `popup.js`) — lets you inspect Meta/Content, run rules, approve or send.
- Options (`options.html`, `options.js`) — configure keywords, replies, and behaviors.
- Constants (`constants.js`) — single source of default configuration.
- Styles (`styles/`) — shared base theme and page‑specific CSS (dark mode supported via `prefers-color-scheme`).


## Permissions and host access
This extension requests the minimum required for its features:
- `storage` — save your configuration locally.
- `activeTab`/`tabs` — communicate with the current LinkedIn tab to read messages and send replies.
- `host_permissions` — `https://www.linkedin.com/*` and `https://linkedin.com/*` so the content script can run on both URL variants.
- `host_permissions` — `https://api.openai.com/*` for AI reply generation (only when enabled).

## Testing and debugging
### Fast rules testing (no LinkedIn DOM)
1. Open `chrome://extensions` → find this extension → Service worker: Inspect.
2. In the console, run:
```
chrome.runtime.sendMessage({ type: 'RUN_RULES_ON_TEXT', text: 'We have a role in Boston' }, console.log)
```
Expected: `{ ok: true, proposal: { rule: 'locationFilter', reply: 'NYC or REMOTE only.' } }`.

### Integration testing on a live tab
- With a LinkedIn conversation open, use the popup:
  - Refresh → fetch latest incoming message.
  - Run Rules → view the selected rule and proposed reply.
  - Approve & Send or Run Rule & Send (no confirm) → verify a sent message appears.

### Content script checks from the page console
On the LinkedIn page (conversation or overlay), open DevTools Console and try:
```
chrome.runtime.sendMessage({ type: 'GET_LATEST_INCOMING' }, console.log)
```
Expected: `{ ok: true, meta: '...', content: '...' }`. If it returns `{ ok: false }`, ensure a conversation is visible and the latest bubble is from the other person.

### Debug logs
In `contentScript.js`, set `const DEBUG = true;` near the top, reload the extension, and watch the page console for `[LIM]` logs.


## Troubleshooting
- Content script not injected
  - Ensure the URL starts with `https://www.linkedin.com/...` (note the `www`).
  - On non‑messaging pages, open the mini chat overlay and select a conversation.
- “No incoming message found”
  - Make sure the last visible bubble is from the other person.
  - Scroll the thread slightly and click Refresh again.
- Composer or Send button not found
  - Ensure the composer is expanded and visible in the active conversation/overlay.
  - LinkedIn occasionally changes classes; open DevTools and share the relevant HTML if needed.
- Service worker sleeps
  - Opening its console (via chrome://extensions → Inspect) wakes it. Reload the extension after changes.


## Icons
Stub icons are included in `icons/` as `icon-16.png`, `icon-32.png`, `icon-48.png`, and `icon-128.png`.
- Regenerate placeholders: `node icons/generate-placeholders.js`
- Replace with your branding: follow `icons/README.md` and reload the extension.


## Privacy
- Your LinkedIn page content is processed locally in the browser.
- Configuration is stored in local extension storage.
- No AI network calls are made unless you enable AI and add an API key.
- If AI is enabled, selected message content and rule/template context are sent to the configured OpenAI model.


## Roadmap (short)
- Optional manual theme selector (Light / Dark / System)
- Unit tests for the rules engine (`evaluateRules`) and CI checks
- Optional debug toggle in Options to avoid editing source


## Release checklist
Before publishing or sharing a build:
1. Reload extension in `chrome://extensions` after pulling latest changes.
2. Open Options and verify AI settings (API key + model), then click **Save**.
3. Run **Test AI Reply** once and confirm output appears.
4. Verify popup flow on a live LinkedIn thread:
   - Refresh
   - Run Rules
   - Approve & Send
5. Check both LinkedIn URL variants:
   - `https://www.linkedin.com/...`
   - `https://linkedin.com/...`


## License
Choose a license (MIT recommended) and add `LICENSE` at the repository root.



# P.S.
(LnChatAI is your personal messaging assistant for LinkedIn.
It analyzes your conversations, suggests replies, and helps you stay responsive — all without leaving LinkedIn.
Whether you're networking or job hunting, LnChatAI keeps your chats fast, friendly, and on point.)
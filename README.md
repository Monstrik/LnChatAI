### LinkedIn Auto-Responder (Chrome Extension)

This Chrome extension helps you handle recruiter messages on LinkedIn by automatically reading incoming messages, proposing a reply based on rules, and optionally sending it automatically.

Key features:
- Detects new incoming messages on LinkedIn messaging pages.
- Applies rules to propose a reply.
- Popup shows message + proposed reply for your approval.
- One-click "Run Rule & Send (no confirm)" button to send immediately.
- Optional auto-send on every new incoming message.
- Options page to tweak keywords and reply texts. AI placeholders available.


#### Installation (Developer Mode)
1. Build is not required. Open Google Chrome.
2. Go to `chrome://extensions`.
3. Enable "Developer mode" (top right).
4. Click "Load unpacked" and select the `extension` folder in this project.
5. Pin the extension icon for quick access.


#### Usage
- Open a LinkedIn conversation (https://www.linkedin.com/messaging/...).
- Click the extension icon to open the popup.
- The popup will show:
  - Latest incoming message (detected from the current tab)
  - Proposed reply according to rules
  - The detected rule name
- Buttons:
  - Refresh: re-grab latest message from the page
  - Run Rules: re-evaluate rules on the message
  - Approve & Send: sends the text currently in the Proposed reply box
  - Run Rule & Send (no confirm): evaluates rules and sends immediately
- Toggle: Auto-send replies — when enabled, the extension sends automatically whenever a new message arrives.


#### Rules (default)
1. Location Filter
   - If the message does NOT contain any of: "New York", "NYC", "Remote" → Reply: `NYC or REMOTE only.`

2. Salary Inquiry
   - If the message contains a job description (keywords: position, role, responsibility, requirement, job)
     but has NO salary/range/compensation keywords → Reply: `What is the salary range?`

3. Missing Job Description
   - If there is no job description → Reply: `Please share the job description and salary range.`

Fallback
- If none of the above clearly applies, default reply asks for JD and salary.

You can edit keywords and reply texts at any time on the Options page.


#### Options Page
- Right-click the extension icon → Options (or open from popup link)
- Customize:
  - Location, Job Description, Salary keywords
  - Replies for each rule and fallback
  - Behavior: Auto-send on/off
  - AI settings: enable flag + API key field (AI is not invoked in this version yet)


#### Notes & Limitations
- The content script uses best-effort selectors to detect messages and the composer; LinkedIn UI can change. If detection fails, use Refresh in the popup and verify you are on a conversation page.
- Auto-send is off by default. Enable it only if you are comfortable with automatic replies being sent.
- AI settings are placeholders; replies are currently rule-based only.


#### Privacy
- No data is sent outside your browser by default. Configuration is stored in local extension storage. If you enable an AI integration in a future version, your message text would be sent to that provider per your settings.

### LinkedIn Auto-Responder (Chrome Extension)

This Chrome extension helps you handle recruiter messages on LinkedIn by automatically reading incoming messages, proposing a reply based on rules, and optionally sending it automatically.

Key features:
- Detects new incoming messages on LinkedIn messaging pages.
- Applies rules to propose a reply.
- Popup shows message + proposed reply for your approval.
- One-click "Run Rule & Send (no confirm)" button to send immediately.
- Optional auto-send on every new incoming message.
- Options page to tweak keywords and reply texts. AI placeholders available.


#### Installation (Developer Mode)
1. Build is not required. Open Google Chrome.
2. Go to `chrome://extensions`.
3. Enable "Developer mode" (top right).
4. Click "Load unpacked" and select the `extension` folder in this project.
5. Pin the extension icon for quick access.


#### Usage
- Open a LinkedIn conversation (https://www.linkedin.com/messaging/...).
- Click the extension icon to open the popup.
- The popup will show:
  - Latest incoming message (detected from the current tab)
  - Proposed reply according to rules
  - The detected rule name
- Buttons:
  - Refresh: re-grab latest message from the page
  - Run Rules: re-evaluate rules on the message
  - Approve & Send: sends the text currently in the Proposed reply box
  - Run Rule & Send (no confirm): evaluates rules and sends immediately
- Toggle: Auto-send replies — when enabled, the extension sends automatically whenever a new message arrives.


#### Rules (default)
1. Location Filter
   - If the message does NOT contain any of: "New York", "NYC", "Remote" → Reply: `NYC or REMOTE only.`

2. Salary Inquiry
   - If the message contains a job description (keywords: position, role, responsibility, requirement, job)
     but has NO salary/range/compensation keywords → Reply: `What is the salary range?`

3. Missing Job Description
   - If there is no job description → Reply: `Please share the job description and salary range.`

Fallback
- If none of the above clearly applies, default reply asks for JD and salary.

You can edit keywords and reply texts at any time on the Options page.


#### Options Page
- Right-click the extension icon → Options (or open from popup link)
- Customize:
  - Location, Job Description, Salary keywords
  - Replies for each rule and fallback
  - Behavior: Auto-send on/off
  - AI settings: enable flag + API key field (AI is not invoked in this version yet)


#### Notes & Limitations
- The content script uses best-effort selectors to detect messages and the composer; LinkedIn UI can change. If detection fails, use Refresh in the popup and verify you are on a conversation page.
- Auto-send is off by default. Enable it only if you are comfortable with automatic replies being sent.
- AI settings are placeholders; replies are currently rule-based only.


#### Privacy
- No data is sent outside your browser by default. Configuration is stored in local extension storage. If you enable an AI integration in a future version, your message text would be sent to that provider per your settings.


#### Icons
- Stub icons are included in `icons/` as `icon-16.png`, `icon-32.png`, `icon-48.png`, and `icon-128.png`.
- If you need to regenerate placeholders, run: `node icons/generate-placeholders.js`.
- To replace with your branding, follow `icons/README.md` for export steps and then reload the extension in Chrome.
// contentScript.js - runs on LinkedIn messaging pages (full thread and mini overlay)

(function () {
    const DEBUG = true; // flip to true to see logs in page console
    const log = (...args) => {
        if (DEBUG) console.debug('[LIM]', ...args);
    };

    const state = {
        lastSeenMessageId: null,
    };

    // Helper: extract meta and content text from a message bubble element
    function extractMessageParts(el) {
        if (!el) return { meta: "", content: "" };
        // Collect meta from specific container
        const metaNodes = el.querySelectorAll('div.msg-s-message-group__meta');
        const contentNodes = el.querySelectorAll('div.msg-s-event__content');

        const cleanJoin = (nodes) => Array.from(nodes)
            .map(n => (n.innerText || '').trim())
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        const meta = cleanJoin(metaNodes);
        const content = cleanJoin(contentNodes);
        return { meta, content };
    }

    // Heuristic: determine if a message is incoming (from others)
    function isIncoming(el) {
        const cls = el.className || '';
        if (cls.includes('msg-s-message-list__event--self')) return false;
        if (cls.includes('msg-s-message-list__event--other')) return true;
        if (cls.includes('msg-overlay-message-bubble--right')) return false; // self on right in overlay
        if (cls.includes('msg-overlay-message-bubble--left')) return true; // other on left in overlay
        // Try bubbles: often have aria-label with sender name; self often labelled 'You'
        const aria = el.getAttribute && (el.getAttribute('aria-label') || '').toLowerCase();
        if (aria.includes('you:')) return false;
        // Fallback: if it has an avatar on the left
        if (el.querySelector('.msg-s-message-group__avatar, .presence-entity__image, img[alt]')) return true;
        return true; // default assume incoming to avoid missing
    }

    // Find the active conversation root (overlay bubble if present, else full thread)
    function findActiveConversationRoot() {
        // Prefer visible, expanded overlay bubble
        const overlays = Array.from(document.querySelectorAll('.msg-overlay-conversation-bubble'))
            .filter(el => el.offsetParent !== null && !el.classList.contains('msg-overlay-conversation-bubble--minimized'));
        const overlayRoot = overlays[overlays.length - 1];
        if (overlayRoot) return overlayRoot;

        // Fall back to full messaging page container
        const full = document.querySelector('.msg-s-message-list, main, [data-qa="message-list"]');
        return full || null;
    }

    // Find the latest message element in the active conversation
    function getLatestMessageEl() {
        const root = findActiveConversationRoot();
        if (!root) return null;
        // Common LinkedIn selectors for message items (full + overlay)
        const candidates = root.querySelectorAll('[data-qa="message-row"], li.msg-s-message-list__event, .msg-s-message-list__event, .msg-s-message-group__container, .msg-overlay-message-bubble');
        if (!candidates.length) return null;
        return candidates[candidates.length - 1];
    }

    // Generate a simple id for a message element to avoid duplicates
    function getMessageId(el) {
        return el?.getAttribute('data-ember-action') || el?.getAttribute('data-id') || el?.id || (el?.outerHTML?.length + ':' + (el?.innerText || '').slice(-20));
    }

    // Notify background about a new incoming message
    function reportLatestIncoming() {
        const el = getLatestMessageEl();
        if (!el) {
            log('No message element found');
            return;
        }
        if (!isIncoming(el)) {
            log('Latest message appears to be self-sent; ignoring');
            return;
        }
        const id = getMessageId(el);
        if (!id || id === state.lastSeenMessageId) {
            return;
        }
        state.lastSeenMessageId = id;
        const parts = extractMessageParts(el);
        if (!parts.content && !parts.meta) {
            log('Extracted parts empty');
            return;
        }
        log('Reporting NEW_INCOMING_MESSAGE', parts);
        chrome.runtime.sendMessage({type: 'NEW_INCOMING_MESSAGE', meta: parts.meta, content: parts.content});
    }

    // Observe DOM changes for new messages
    const observer = new MutationObserver(() => {
        try {
            reportLatestIncoming();
        } catch (e) { /* ignore */
        }
    });

    function startObserver() {
        const root = findActiveConversationRoot();
        if (!root) {
            // Retry later if messaging UI not present yet (e.g., overlay opens later)
            setTimeout(startObserver, 1500);
            return;
        }
        observer.observe(root, {childList: true, subtree: true});
        // initial scan
        setTimeout(reportLatestIncoming, 800);
    }

    // Find composer and send within the active conversation
    function findActiveComposerRoot() {
        const root = findActiveConversationRoot();
        return root || document;
    }

    // Sending a reply: fill composer and click send
    async function sendReply(text) {
        const scope = findActiveComposerRoot();
        // Find composer contenteditable (full + overlay)
        const editable = scope.querySelector('div.msg-form__contenteditable[contenteditable="true"], div[role="textbox"].msg-form__contenteditable, .msg-overlay-conversation-bubble div[role="textbox"][contenteditable="true"], [data-test-conversation-compose-box] [contenteditable="true"]');
        if (!editable) throw new Error('Composer not found');

        // Helpers
        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        const isDisabled = (btn) => btn.hasAttribute('disabled') || btn.getAttribute('aria-disabled') === 'true' || btn.classList.contains('artdeco-button--disabled');

        // Focus editor
        editable.focus();

        // Clear existing content robustly
        try { document.execCommand('selectAll', false, null); } catch (e) {}
        try { document.execCommand('delete', false, null); } catch (e) {}
        try { document.execCommand('insertText', false, ''); } catch (e) {}
        editable.innerHTML = '';

        // Try to insert via execCommand first (recognized by many editors)
        let inserted = false;
        try {
            inserted = document.execCommand('insertText', false, text);
        } catch (e) {
            inserted = false;
        }

        if (!inserted) {
            // Fallback: set HTML paragraphs so placeholder is removed
            const escapeHtml = (s) => String(s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            const html = String(text).split(/\n/).map(p => `<p>${escapeHtml(p) || '<br>'}</p>`).join('');
            editable.innerHTML = html || '<p><br></p>';
        }

        // Dispatch events to notify LinkedIn/React of change
        editable.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: text, inputType: inserted ? 'insertText' : 'insertFromPaste' }));
        editable.dispatchEvent(new Event('change', { bubbles: true }));
        editable.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', bubbles: true }));

        // Find Send button
        let sendBtn = scope.querySelector('button.msg-form__send-button, button[aria-label="Send"], .msg-overlay-conversation-bubble button[aria-label="Send"], form.msg-form__form button[type="submit"]');
        if (!sendBtn) throw new Error('Send button not found');

        // Wait for enablement briefly
        for (let i = 0; i < 10; i++) {
            if (!isDisabled(sendBtn)) break;
            await wait(100);
        }

        if (isDisabled(sendBtn)) {
            // Try sending via Enter key
            const fire = (type) => editable.dispatchEvent(new KeyboardEvent(type, { key: 'Enter', code: 'Enter', which: 13, keyCode: 13, bubbles: true }));
            fire('keydown');
            fire('keypress');
            fire('keyup');
            await wait(150);
        }

        // Click send (works whether disabled attribute is respected or not)
        sendBtn.click();
    }

    // Listen for commands from background/popup
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        (async () => {
            if (msg.type === 'SEND_REPLY') {
                try {
                    await sendReply(msg.text || '');
                    sendResponse({ok: true});
                } catch (e) {
                    sendResponse({ok: false, error: e.message});
                }
                return;
            }
            if (msg.type === 'GET_LATEST_INCOMING') {
                const el = getLatestMessageEl();
                if (el && isIncoming(el)) {
                    const parts = extractMessageParts(el);
                    sendResponse({ok: true, meta: parts.meta, content: parts.content});
                } else {
                    sendResponse({ok: false, error: 'No incoming message found'});
                }
                return;
            }
        })();
        return true;
    });

    // Kick off
    startObserver();
})();

// Prefer package exports for consumers; use local src path only when developing SDK.
import { getReadyDecentClient, extractThid } from 'decent_app_sdk';

const out = document.querySelector('#out');
const btnInit = document.querySelector('#init');
const btnA = document.querySelector('#send-a');
const btnB = document.querySelector('#send-b');

let sdk;
/**
 * Thread-Based Messaging Example
 * 
 * This example demonstrates the difference between:
 * 1. thid - Used for delivery routing and correlation
 * 2. reply_to - Used for conversation threading
 *
 * Flow (visual):
 *   You  --(pack)->  Msg(type=pink) [thid=A]  --send-->  Peer
 *   Peer --response--> Msg(type=pong) [thid=A] --recv-->  You
 *
 * Common pitfalls:
 * - Forgetting to pass replyTo for replies; results in new thread.
 * - Assuming thid equals conversation id; it's for routing, maintain your own mapping.
 * 
 * Key Concepts:
 * - When starting a new conversation, pass empty string "" for replyTo
 * - When replying, pass the raw previous message as replyTo parameter
 * - The browser extracts the thid from the replyTo message automatically
 * - thids are maintained across the conversation for proper threading
 * 
 * Try this:
 * 1. Click "Send New Message (Thread A)" to start a conversation
 * 2. Wait for a response (if you have a receiver set up)
 * 3. Click "Reply to Last Message (Thread A)" to continue the thread
 * 4. Notice how the thid remains consistent
 * 5. Start a new thread with "Send New Message (Thread B)" to see multiple concurrent threads
 */

let conversationHistory = {
  'thread-A': [],
  'thread-B': [],
  'thread-C': []
};
let lastReceivedMessage = null;

btnInit.addEventListener('click', async () => {
  sdk = await getReadyDecentClient({ serviceWorkerUrl: './sw.js' });
  out.textContent += 'SDK ready (thread-based delivery configured in sw.js)\n';
  sdk.onMessage(async (incoming) => {
    try {
      const unpacked = await sdk.unpack(incoming);
      if (!unpacked.success) return;
      const message = JSON.parse(unpacked.message);
      lastReceivedMessage = JSON.stringify(message); // store stringified unpacked envelope for replyTo
      const thid = extractThid(message) || 'unknown';
      const threadKey = Object.keys(conversationHistory).find(k => thid.includes(k)) || 'thread-A';
      conversationHistory[threadKey].push({ direction: 'in', text: message.body?.text || '[ping response]', thid, timestamp: new Date().toISOString() });
      out.textContent += `\n📨 Received in ${threadKey}: ${message.body?.text || '[ping response]'} (thid: ${String(thid).substring(0, 12)}...)`;
      displayConversationHistory();
    } catch (e) {
      out.textContent += `\n❌ Error receiving message: ${e.message}`;
    }
  });
});

async function sendOnce(threadName, isReply = false) {
  const dest = 'did:example:receiver';
  const body = isReply && lastReceivedMessage ? { text: `Reply in ${threadName}: This is a threaded response` } : { text: `New message in ${threadName}: Starting conversation` };
  const replyTo = isReply && lastReceivedMessage ? lastReceivedMessage : "";
  try {
    const packed = await sdk.pack(dest, 'https://didcomm.org/test/1.0/ping', JSON.stringify(body), [], replyTo);
    if (packed?.success) {
      const effectiveThid = packed.thid || 'unknown';
      const ok = await sdk.send(dest, packed.message, effectiveThid);
      conversationHistory[threadName].push({ direction: 'out', text: body.text, thid: effectiveThid, isReply, timestamp: new Date().toISOString() });
      const messageType = isReply ? '↩️ REPLY' : '🆕 NEW';
      out.textContent += `\n${messageType} sent to ${dest} in ${threadName}:\n`;
      out.textContent += `  Message: ${body.text}\n`;
      out.textContent += `  thid: ${effectiveThid}\n`;
      out.textContent += `  Reply To: ${isReply ? 'Previous message' : 'None (new thread)'}\n`;
      out.textContent += `  Status: ${ok}\n`;
      displayConversationHistory();
    } else {
      out.textContent += `\n❌ Pack failed: ${packed?.error || 'unknown error'}\n`;
    }
  } catch (e) {
    out.textContent += `\n❌ Error: ${e.message}\n`;
  }
}

function displayConversationHistory() {
  out.textContent += '\n\n📋 Conversation History:\n';
  for (const [threadName, messages] of Object.entries(conversationHistory)) {
    if (messages.length > 0) {
      out.textContent += `\n  ${threadName}:\n`;
      messages.forEach((msg, idx) => {
        const arrow = msg.direction === 'out' ? '→' : '←';
        const replyIndicator = msg.isReply ? ' (reply)' : '';
        out.textContent += `    ${idx + 1}. ${arrow} ${msg.text}${replyIndicator}\n`;
      });
    }
  }
  out.textContent += '\n' + '='.repeat(60) + '\n';
}

// New message buttons
btnA.textContent = 'Send New Message (Thread A)';
btnA.addEventListener('click', () => sendOnce('thread-A', false));

btnB.textContent = 'Send New Message (Thread B)';
btnB.addEventListener('click', () => sendOnce('thread-B', false));

// Add reply buttons
const btnReplyA = document.createElement('button');
btnReplyA.textContent = 'Reply to Last Message (Thread A)';
btnReplyA.addEventListener('click', () => {
  if (!lastReceivedMessage) {
    out.textContent += '\n⚠️ No message to reply to. Send a message first and wait for a response.\n';
    return;
  }
  sendOnce('thread-A', true);
});
document.body.insertBefore(btnReplyA, out);

const btnReplyB = document.createElement('button');
btnReplyB.textContent = 'Reply to Last Message (Thread B)';
btnReplyB.addEventListener('click', () => {
  if (!lastReceivedMessage) {
    out.textContent += '\n⚠️ No message to reply to. Send a message first and wait for a response.\n';
    return;
  }
  sendOnce('thread-B', true);
});
document.body.insertBefore(btnReplyB, out);

// Add thread C button for demonstrating multiple concurrent threads
const btnC = document.createElement('button');
btnC.textContent = 'Send New Message (Thread C)';
btnC.addEventListener('click', () => sendOnce('thread-C', false));
document.body.insertBefore(btnC, out);



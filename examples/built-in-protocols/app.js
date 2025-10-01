// Use package exports for consumers. For SDK development, you may import from '../../src/client/singleton.js'.
import { getReadyDecentClient } from 'decent_app_sdk';

const out = document.querySelector('#out');
const btn = document.querySelector('#discover');
const sendMsgBtn = document.querySelector('#sendMsg');
const loadInboxBtn = document.querySelector('#loadInbox');
const inboxEl = document.querySelector('#inbox');
const msgTo = document.querySelector('#msgTo');
const msgContent = document.querySelector('#msgContent');

const profTo = document.querySelector('#profTo');
const displayName = document.querySelector('#displayName');
const description = document.querySelector('#description');
const sendProfileBtn = document.querySelector('#sendProfile');
const requestProfileBtn = document.querySelector('#requestProfile');
const profileOut = document.querySelector('#profileOut');

const createInviteBtn = document.querySelector('#createInvite');
const inviteUrl = document.querySelector('#inviteUrl');
const parseInviteBtn = document.querySelector('#parseInvite');
const inviteOut = document.querySelector('#inviteOut');

const rpTo = document.querySelector('#rpTo');
const rpCode = document.querySelector('#rpCode');
const rpExplain = document.querySelector('#rpExplain');
const sendReportBtn = document.querySelector('#sendReport');
const loadReportsBtn = document.querySelector('#loadReports');
const reportsOut = document.querySelector('#reportsOut');

const mediaTo = document.querySelector('#mediaTo');
const mediaMime = document.querySelector('#mediaMime');
const mediaFilename = document.querySelector('#mediaFilename');
const mediaBase64 = document.querySelector('#mediaBase64');
const mediaUrl = document.querySelector('#mediaUrl');
const shareMediaBtn = document.querySelector('#shareMedia');
const loadMediaBtn = document.querySelector('#loadMedia');
const mediaOut = document.querySelector('#mediaOut');

const sdk = await getReadyDecentClient({ serviceWorkerUrl: '/sw.js' });

btn.addEventListener('click', async () => {
  const providers = await sdk.protocols.intents.discover(['*'], 800);
  out.textContent = JSON.stringify(providers, null, 2);
});

sendMsgBtn.addEventListener('click', async () => {
  const to = String(msgTo.value || '').trim();
  const content = String(msgContent.value || '').trim();
  try {
    await sdk.protocols['basic-message-v2'].sendMessage(to, content);
    out.textContent = 'Message sent.';
  } catch (e) {
    out.textContent = String(e?.message || e);
  }
});

loadInboxBtn.addEventListener('click', async () => {
  const res = await sdk.protocols['basic-message-v2'].getMessages();
  inboxEl.textContent = JSON.stringify(res?.messages || [], null, 2);
});

sendProfileBtn.addEventListener('click', async () => {
  const to = String(profTo.value || '').trim();
  const profile = { displayName: displayName.value, description: description.value };
  await sdk.protocols['user-profile-v1'].sendProfile(to, profile, { send_back_yours: true });
  out.textContent = 'Profile sent.';
});

requestProfileBtn.addEventListener('click', async () => {
  const to = String(profTo.value || '').trim();
  const res = await sdk.protocols['user-profile-v1'].requestProfile(to, { timeoutMs: 4000 });
  profileOut.textContent = JSON.stringify(res, null, 2);
});

createInviteBtn.addEventListener('click', async () => {
  const { url } = await sdk.protocols['out-of-band-v2'].createInvitation({ goal_code: 'p2p-messaging' });
  inviteOut.textContent = url;
});

parseInviteBtn.addEventListener('click', async () => {
  const parsed = await sdk.protocols['out-of-band-v2'].parseInvitation(String(inviteUrl.value || ''));
  inviteOut.textContent = JSON.stringify(parsed, null, 2);
});

sendReportBtn.addEventListener('click', async () => {
  const to = String(rpTo.value || '').trim();
  const report = { problemCode: rpCode.value, explain: rpExplain.value };
  await sdk.protocols['report-problem-v2'].sendProblemReport(to, report);
  out.textContent = 'Problem report sent.';
});

loadReportsBtn.addEventListener('click', async () => {
  const res = await sdk.protocols['report-problem-v2'].getProblemReports();
  reportsOut.textContent = JSON.stringify(res, null, 2);
});

shareMediaBtn.addEventListener('click', async () => {
  const to = String(mediaTo.value || '').trim();
  // Canonical format (recommended):
  // { mimeType: 'image/jpeg', filename: 'photo.jpg', data: 'base64...' }
  // or external URL:
  // { mimeType: 'image/jpeg', filename: 'photo.jpg', externalUrl: 'https://...' }
  // Legacy format (still supported) for reference:
  // { mime_type: 'image/jpeg', filename: 'photo.jpg', base64: '...', url: 'https://...' }
  const url = String(mediaUrl.value || '').trim();
  const base64 = String(mediaBase64.value || '');
  const media = url
    ? { mimeType: mediaMime.value, filename: mediaFilename.value, externalUrl: url }
    : { mimeType: mediaMime.value, filename: mediaFilename.value, data: base64 };
  await sdk.protocols['share-media-v1'].shareMedia(to, media, { note: 'example' });
  out.textContent = 'Shared media.';
});

loadMediaBtn.addEventListener('click', async () => {
  const res = await sdk.protocols['share-media-v1'].getSharedMedia();
  mediaOut.textContent = JSON.stringify(res, null, 2);
});


// Trust-Ping protocol example
const pingBtn = document.querySelector('#ping');
const pingAndWaitBtn = document.querySelector('#pingAndWait');
const pingTo = document.querySelector('#pingTo');
const pingOut = document.querySelector('#pingOut');

pingBtn?.addEventListener('click', async () => {
  const to = String(pingTo?.value || '').trim();
  pingOut.textContent = 'Sending ping...';
  try {
    await sdk.protocols['trust-ping-v2'].ping(to, { comment: 'hello' });
    pingOut.textContent = 'Ping sent.';
  } catch (e) {
    pingOut.textContent = 'Ping failed: ' + String(e?.message || e);
  }
});

pingAndWaitBtn?.addEventListener('click', async () => {
  const to = String(pingTo?.value || '').trim();
  pingOut.textContent = 'Pinging and waiting...';
  try {
    const res = await sdk.protocols['trust-ping-v2'].pingAndWait(to, { timeoutMs: 3000 });
    pingOut.textContent = 'Ping response: ' + JSON.stringify(res, null, 2);
  } catch (e) {
    pingOut.textContent = 'Ping failed: ' + String(e?.message || e);
  }
});

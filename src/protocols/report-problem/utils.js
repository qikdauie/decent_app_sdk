import { MessageTypes } from '../../constants/index.js';
export const PROBLEM_REPORT_TYPE = MessageTypes.REPORT_PROBLEM.PROBLEM_REPORT;

export const PROBLEM_CODES = {
  request_not_accepted: 'request_not_accepted',
  response_processing_error: 'response_processing_error',
  request_processing_error: 'request_processing_error',
  message_parse_error: 'message_parse_error',
};

export function validateProblemReport(envelopeOrBody) {
  const env = envelopeOrBody && envelopeOrBody.body ? envelopeOrBody : { body: envelopeOrBody };
  const body = env?.body;
  if (!body || typeof body !== 'object') return false;
  if (typeof body['problem-code'] !== 'string' || !body['problem-code']) return false;
  if (body.explain !== undefined && typeof body.explain !== 'string') return false;
  if (body.args !== undefined && typeof body.args !== 'object') return false;
  if (body.escalate_to !== undefined && typeof body.escalate_to !== 'string') return false;
  // Top-level headers (optional): thid, pthid, web_redirect
  if (env?.thid !== undefined && typeof env.thid !== 'string') return false;
  if (env?.pthid !== undefined && typeof env.pthid !== 'string') return false;
  if (env?.web_redirect !== undefined) {
    const wr = env.web_redirect;
    if (!wr || typeof wr !== 'object') return false;
    if (typeof wr.status !== 'string' || typeof wr.redirectUrl !== 'string') return false;
  }
  return true;
}

/**
 * @param {{ problemCode?: string, explain?: string, args?: any, escalate_to?: string, web_redirect?: { status: string, redirectUrl: string }, thid?: string, pthid?: string }} [opts]
 */
export function buildProblemReportBody({ problemCode, explain, args, escalate_to, web_redirect, thid, pthid } = /** @type {any} */ ({})) {
  const body = { ['problem-code']: String(problemCode || '') };
  if (!body['problem-code']) throw new Error('problem-code is required');
  if (explain != null) body.explain = String(explain);
  if (args && typeof args === 'object') body.args = args;
  if (escalate_to != null) body.escalate_to = String(escalate_to);
  const headers = {};
  if (thid) headers.thid = String(thid);
  if (pthid) headers.pthid = String(pthid);
  if (web_redirect && typeof web_redirect === 'object') headers.web_redirect = { status: String(web_redirect.status), redirectUrl: String(web_redirect.redirectUrl) };
  return { body, headers };
}

export function extractProblemDetails(envelope) {
  const b = envelope?.body || {};
  return {
    problemCode: b['problem-code'],
    explain: b.explain,
    args: b.args,
    escalate_to: b.escalate_to,
    web_redirect: envelope?.web_redirect,
    thid: envelope?.thid,
    pthid: envelope?.pthid,
  };
}



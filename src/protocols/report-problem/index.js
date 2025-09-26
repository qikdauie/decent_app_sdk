import { BaseProtocol } from '../base.js';
import { PROBLEM_REPORT_TYPE, validateProblemReport, buildProblemReportBody, extractProblemDetails } from './utils.js';

export class ReportProblemProtocol extends BaseProtocol {
  constructor() {
    super({
      id: 'report-problem-v2',
      piuri: 'https://didcomm.org/report-problem/2.0',
      version: '2.0',
      messageTypes: [PROBLEM_REPORT_TYPE],
    });
    /** @type {Array<any>} */
    this._reports = [];
    /** @type {{ keepLast?: number, maxAgeMs?: number|null }} */
    this._retention = { keepLast: 100, maxAgeMs: null };
  }

  declareClientMethods() {
    return {
      sendProblemReport: { params: ['to', 'report'], description: 'Send a problem-report' },
      getProblemReports: { params: [], description: 'Get received problem reports' },
    };
  }

  async handleIncoming(envelope) {
    const { type, body } = envelope || {};
    if (type !== PROBLEM_REPORT_TYPE) return false;
    if (!validateProblemReport(envelope)) return false;
    this._reports.push(envelope);
    this._pruneRetention();
    return true;
  }

  async invokeClientMethod(methodName, args) {
    if (methodName === 'sendProblemReport') {
      const [to, report] = Array.isArray(args) ? args : [args];
      if (!to || typeof to !== 'string') throw new Error('to is required');
      const { body, headers } = buildProblemReportBody(report || {});
      const ok = await this.runtime.sendType(to, PROBLEM_REPORT_TYPE, body, { headers });
      if (!ok) throw new Error('send failed');
      return { ok: true };
    }
    if (methodName === 'getProblemReports') {
      return { ok: true, reports: this._reports.map(extractProblemDetails) };
    }
    throw new Error(`Unknown method: ${methodName}`);
  }

  _pruneRetention() {
    try {
      const { keepLast, maxAgeMs } = this._retention || {};
      if (Number.isFinite(keepLast) && keepLast > 0 && this._reports.length > keepLast) {
        this._reports = this._reports.slice(-keepLast);
      }
      if (Number.isFinite(maxAgeMs) && maxAgeMs > 0) {
        const now = Date.now();
        this._reports = this._reports.filter(r => {
          const t = r?.body?.time || r?.sent_time; // best-effort if present
          const tt = t ? Date.parse(t) : NaN;
          return Number.isFinite(tt) ? (now - tt) <= maxAgeMs : true;
        });
      }
    } catch {}
  }
}

export default ReportProblemProtocol;



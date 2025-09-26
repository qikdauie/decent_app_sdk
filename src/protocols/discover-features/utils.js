/**
 * Discover-Features 2.0 utilities (JavaScript-first)
 */

export function buildQueryBody(matchers = []) {
  const toQuery = (item) => {
    if (typeof item === 'string') {
      return { ['feature-type']: 'message-type', match: item };
    }
    if (item && typeof item === 'object') {
      const ft = item['feature-type'] || item.feature_type || item.featureType || 'message-type';
      const match = item.match != null ? item.match : (item.id != null ? item.id : '*');
      return { ['feature-type']: String(ft), match: String(match) };
    }
    return { ['feature-type']: 'message-type', match: '*' };
  };
  const queries = (Array.isArray(matchers) ? matchers : [matchers]).map(toQuery);
  return { queries };
}

import { MessageTypes } from '../../constants/message-types.js';

export function isDisclosePacket(msg) {
  return msg?.type === MessageTypes.DISCOVER_FEATURES.DISCLOSE;
}

export function extractFeatures(msg) {
  if (Array.isArray(msg?.body?.disclosures)) return msg.body.disclosures;
  if (Array.isArray(msg?.body?.features)) return msg.body.features; // legacy fallback
  return [];
}

export function matchFeatures(localFeatures, queries) {
  if (!Array.isArray(localFeatures) || !Array.isArray(queries)) return [];
  const results = [];
  for (const feature of localFeatures) {
    for (const q of queries) {
      const qType = q?.['feature-type'] || q?.feature_type || q?.featureType || 'protocol';
      const pattern = q?.match || q?.id || '';
      if (!pattern) continue;
      if (qType !== feature.featureType) continue;
      if (globTest(pattern, feature.id)) {
        results.push(feature);
        break;
      }
    }
  }
  return results;
}

function globTest(pattern, value) {
  try {
    const regex = globToRegExp(pattern);
    return regex.test(String(value));
  } catch {
    return false;
  }
}

function globToRegExp(glob) {
  const escaped = String(glob)
    .replace(/[.+^${}()|\[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp('^' + escaped + '$');
}



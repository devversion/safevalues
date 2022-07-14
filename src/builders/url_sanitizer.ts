/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Provides functions to enforce the SafeUrl contract at the sink
 * level.
 */

import '../environment/dev';

/**
 * An inert URL, used as an inert return value when an unsafe input was
 * sanitized.
 */
export const INNOCUOUS_URL: string = 'about:invalid';

function extractScheme(url: string): string|undefined {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    // According to https://url.spec.whatwg.org/#constructors, the URL
    // constructor with one parameter throws if `url` is not absolute. In this
    // case, we are sure that no explicit scheme (javascript: ) is set.
    // This can also be a URL parsing error, but in this case the URL won't be
    // run anyway.
    return 'https:';
  }
  return parsedUrl.protocol;
}

// We can't use an ES6 Set here because gws somehow depends on this code and
// doesn't want to pay the cost of a polyfill.
const ALLOWED_SCHEMES = ['data:', 'http:', 'https:', 'mailto:', 'ftp:'];

/**
 * Replaces javascript: URLs with an innocuous URL.
 * The URL parsing relies on the URL API in browsers that support it.
 * @param url The URL to sanitize for a SafeUrl sink.
 */
export function sanitizeJavascriptUrl(url: string): string {
  const parsedScheme = extractScheme(url);
  if (parsedScheme === 'javascript:') {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`A URL with content '${
          url}' was sanitized away. javascript: URLs can lead to XSS and is a CSP rollout blocker.`);
    }
    return INNOCUOUS_URL;
  }
  return url;
}

/**
 * Type alias for URLs passed to DOM sink wrappers.
 */
export type Url = string;

/**
 * Adapter to sanitize string URLs in DOM sink wrappers.
 */
export function unwrapUrlOrSanitize(url: Url): string {
  return sanitizeJavascriptUrl(url);
}

/**
 * Sanitizes a URL restrictively.
 * This sanitizer protects against XSS and potentially other uncommon and
 * undesirable schemes that an attacker could use for e.g. phishing (tel:,
 * callto: ssh: etc schemes). This sanitizer is primarily meant to be used by
 * the HTML sanitizer.
 */
export function restrictivelySanitizeUrl(url: string): string {
  const parsedScheme = extractScheme(url);
  if (parsedScheme !== undefined &&
      ALLOWED_SCHEMES.indexOf(parsedScheme.toLowerCase()) !== -1) {
    return url;
  }
  return 'about:invalid#zClosurez';
}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {unwrapUrlOrSanitize, Url} from '../../builders/url_sanitizer';

/**
 * Sets the Href attribute from the given Url.
 */
export function setHref(anchor: HTMLAnchorElement, url: Url) {
  anchor.href = unwrapUrlOrSanitize(url);
}

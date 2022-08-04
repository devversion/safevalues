/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */


// Expected types for the prop argument in safeSetProperty.
type PropertyType = number|string;

/** @const {!string} An error message used in safeSetProperty. */
export const ERROR_MESSAGE = 'The receiver is not safe to assign a property';

/**
 * Checks if the receiver object is not referencing dangerous object (such as
 * Object.prototype) before assigning a property to the receiver.
 */
export function safeSetProperty<T>(
    receiver: {[key: PropertyType]: T}, prop: PropertyType, value: T): T {
  if (receiver === receiver?.constructor?.prototype ||
      typeof receiver !== 'object') {
    throw new Error(ERROR_MESSAGE);
  }
  return (receiver[prop] = value);
}

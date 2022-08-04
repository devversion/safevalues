/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {ERROR_MESSAGE, safeSetProperty} from './set_property';

describe('safeSetProperty', () => {
  it('successfully assigns property when safe', () => {
    const receiver: {[key: string]: string} = {};
    const prop = 'foo';
    const value = 'bar';
    expect(safeSetProperty(receiver, prop, value)).toEqual(value);
    expect(receiver[prop]).toEqual(value);
  });

  it('throws when receiver points to prototype', () => {
    const prop = 'foo';
    const value = 'bar';
    const functionPrototype = ({}).constructor.constructor.prototype;
    const fooPrototype = (class Foo {}).prototype as {[key: string]: string};

    [Object.prototype, functionPrototype, Array.prototype, String.prototype,
     fooPrototype]
        .forEach((prototype) => {
          expect(() => {
            return safeSetProperty(prototype, prop, value);
          }).toThrowError(ERROR_MESSAGE);
          expect(prototype.foo).toEqual(undefined);
        });
  });

  it('throws when receiver points to built-in function', () => {
    const toString = ({}).constructor.prototype.toString;

    expect(() => {
      return safeSetProperty(toString, 'x', true);
    }).toThrowError(ERROR_MESSAGE);
    expect(toString.x).toEqual(undefined);
  });
});

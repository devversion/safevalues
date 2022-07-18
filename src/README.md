# safevalues

**This is not an officially supported Google product.**

WARNING: This library is still in development and we might make backward
incompatible changes at any moment.

## What this library is about

### A policy definition to build safe by construction Trusted Types

Trusted Types is a browser API that enable developers to have control on the
values that can be assigned to XSS sinks. Developers need to define a Trusted
Type policy to build these values, and the Trusted Type API does constrain these
policies. \
The safevalues library provides a set of functions that can be use to create
Trusted Types values safely, by construction or via escaping or sanitization.
safevalues implements a Trusted Type policy (when available) under the hood.

### Additional types for sinks not covered by Trusted Types

Some DOM APIs are not covered by Trusted Types but can also be abused and lead
to XSS. Other security mechanisms like the `unsafe-inline` CSP protection can
help to lock them down, but not all browsers or apps support it. \
Safevalues defines additional types, builders and setters to help protect these
sinks.

### DOM sink wrappers

To build at a Trusted Type compatible app and surface potential violations at
compile time, we recommend that you compile your code with
[tsec](https://github.com/googleinterns/tsec). Tsec bans certain DOM APIs.
safevalues defines wrappers around these APIs to let you assign Trusted Types
with them.

Certain wrappers don't require a particular type but sanitize the argument they
get before they assign it to the DOM sink (e.g. `safeLocation.setHref`).

### Trusted Type polyfills

Whenever possible, safevalues uses Trusted Types to build its values, and
benefit from the runtime protection of Trusted Types. When Trusted Type is not
available, safevalues transparently defines it own types and you app can
continue to work.

## Builders

Below are all the builders we currently provide.

### `SafeHtml`

#### Escaping HTML entities

Escaping all HTML entities will make sure that the result is always interpreted
as text when used in an HTML context.

Note: this type aliases the
[TrustedHTML](https://developer.mozilla.org/en-US/docs/Web/API/TrustedHTML)
trusted type.

```typescript
import {htmlEscape} from 'safevalues';

const html = htmlEscape('<img src=a onerror="javascript:alert()">');
// SafeHtml{'&lt;img src=a onerror=&quot;javascript:alert()&quot;&gt'}
```

#### HTML sanitizer

An HTML sanitizer can take a user controlled value and sanitize it to produce a
SafeHtml instance.

```typescript
import {HtmlSanitizerBuilder} from 'safevalues';

const sanitizer = new HtmlSanitizerBuilder()
                            .onlyAllowElements(new Set<string>(['article']))
                            .build();
const html = sanitizer.sanitize('<article>my post <script>alert(0)</script></article>');
// SafeHtml{'<article>my post</article>}
```

#### Templating language

For more complex HTML constructions, use a dedicated HTML templating system
compatible with safevalues ~~like [Lit](https://lit.dev)~~. (soon)

### `SafeScript`

#### Building a script from a literal value

There can be a need to defer the evaluation of a piece of JavaScript. By
preventing any interpolation in the script's value we ensure it can never
contain user data.

Note: this type aliases the
[TrustedScript](https://developer.mozilla.org/en-US/docs/Web/API/TrustedScript)
trusted type.

```typescript
import {safeScript} from 'safevalues';

const script = safeScript`return this;`;
// SafeScript{'return this;'}
```

### `TrustedResourceUrl`

#### Building a URL from a literal value with limited interpolation

Script URLs are potentially very dangerous as they allow to execute code in the
current origin. Only knowing the origin from which a url is from is not
sufficient to ensure its safety as many domains have certain paths that
implement open-redirects to arbitrary URLs.

To ensure the safety of script URLs, we ensure that the developer knows the full
origin (either by fully specifying it or by using the current origin implicitly
with a path absolute url) as well as the path (no relative URLs are allowed &
all interpolations are passed to `encodeURIComponent`)

Note: this type aliases the
[TrustedScriptURL](https://developer.mozilla.org/en-US/docs/Web/API/TrustedScriptURL)
trusted type.

```typescript
import {trustedResourceUrl} from 'safevalues';

const url1 = trustedResourceUrl`/static/js/main.js`;
// TrustedResourceURL{'/static/js/main.js'}

const env = 'a/b';
const opt = 'min&test=1';
const url2 = trustedResourceUrl`/static/${env}/js/main.js?opt=${opt}`;
// TrustedResourceURL{'/static/a%2Fb/js/main.js?opt=min%26test%3D1'}
```

### `SafeStyle`

#### Building a style value from a literal value with some banned characters

Note: this type doesn't wrap a Trusted Type.

```typescript
import {safeStyle, concatStyles} from 'safevalues';

const style1 = safeStyle`color: navy;`;
// SafeStyle{'color: navy;'}
const style2 = safeStyle`background: red;`;

concatStyles([style1, style2]);
// SafeStyle{'color: navy;background: red;'}
```

### `SafeStyleSheet`

#### Building a style value from a literal value with some banned characters

Note: this type doesn't wrap a Trusted Type.

```typescript
import {safeStyleSheet, concatStyleSheets} from 'safevalues';

const styleSheet1 = safeStyleSheet`a { color: navy; }`;
// SafeStyleSheet{'a {color: navy;}'}
const styleSheet2 = safeStyle`b { color: red; }`;

concatStyles([styleSheet1, styleSheet2]);
// SafeStyleSheet{'a {color: navy;}b { color: red; }'}
```

## Use with browsers that don't support Trusted Types

When Trusted Types are not available, the library will automatically return
simple objects that behave identically to Trusted Types, that is they don't
inherit string functions, and only stringify to their inner value.

While this doesn't give as strong assurance in browsers that do not support
Trusted Types, it allows you to preserve the same functional behaviour and
abstract away the fact that some browser might not support Trusted Types.

## Note on literals

To ensure that the values we produce are safe, we design our APIs in a way to
easily make the distinction between potentially user-provided data vs
programmer-authored values, which we encode as literals (also known as
compile-time constants in other languages).

The principal mechanism we use to programmatically encode literal values is
tagged templates. This ensures that our API is easy to use as-is in JavaScript
without relying on typing tricks or additional tooling.

## Sinks

Using Trusted Types in TypeScript still has a limitation as the standard lib has
[no awareness of Trusted Types](https://github.com/microsoft/TypeScript/issues/30024).
This means that you cannot assign a Trusted Type value to a sink directly.

As explained in
[tsec's README](https://github.com/googleinterns/tsec#trusted-type-awareness-in-tsec-rules),
there are two main ways to support assigning to sinks in a way that will satisfy
the TypeScript compiler and be recognized by tsec.

### Casting the value to `string`

While we provide no explicit support for this, the values we produce will
stringify as expected, so casting them as `string` before assigning them to a
sink should mostly work as expected.

```typescript
const html: TrustedHTML = ...;
document.body.innerHTML = html as unknown as string;
```

Unfortunately, this will only work for sinks that can accept an object and
implicitly stringify it. `eval` for example is not one such sink and will just
passthrough any value passed to it that is not a string (or a `TrustedScript`
for Trusted Types enabled browsers)

```typescript
const script: TrustedScript = ...;
// This will do nothing in browser that don't support Trusted Types
eval(script as unknown as string);
```

### Using an unwrapping function

We also provide three functions that you can use to explicitly unwrap values
before passing them to sinks in a way that tsec will understand.

```typescript
import {unwrapScript} from 'safevalues';
const script: TrustedScript = ...;
eval(unwrapScript(script) as string); // works!
```

The unwrap functions' return type is `string|Trusted*`, which allows the
returned value to be cast to `string` without using `unknown`.

In Trusted Types enabled browsers, the unwrap functions behave like identity
functions and just return their input.

In browsers that do not support Trusted Types, the unwrap functions serve two
purposes:

-   They unwrap the objects into their string representation to avoid relying on
    the implicit stringifier behaviour.
-   They perform runtime checks to ensure the passed in value was created by the
    library, giving you similar runtime guarantees as for Trusted Types enforced
    browsers.

## Reviewed and legacy conversions

There are certain situations when migrating a codebase to be safe using Trusted
Types can be difficult because it requires changing large parts of the code
together or because the provided builders are too restrictive for some
particular usage.

To help with these migrations, we provide two additional sets of functions that
can reduce the impact of the issues above.

WARNING: Make sure you use `tsec` to keep track of how your code is using these
functions.

More information:
[Restricted functions documentation](https://github.com/google/safevalues/tree/main/src/restricted).

# Security review — October 9, 2026

## What GitHub reported

The initial review found eight open Dependabot pull requests, 16 open dependency alerts (three critical, six high, five medium, two low), and two open CodeQL alerts. Secret scanning returned no open alerts. These are reports of vulnerable dependencies or code patterns; they do not establish that the website was compromised.

Most affected packages were development/build dependencies. The deployed website consists of static files served by nginx; the separate Reqarr service runs its own Node dependencies. Both dependency trees were checked separately.

## Pull requests reviewed and integrated

| Pull request | Update | Security concern |
| --- | --- | --- |
| [#102](https://github.com/Ali229/MyWebpage/pull/102) | proxy-addr 2.0.8 | Spoofed client IP addresses in certain proxy trust configurations |
| [#103](https://github.com/Ali229/MyWebpage/pull/103) | brace-expansion | Excessive CPU use and recursion when expanding crafted patterns |
| [#104](https://github.com/Ali229/MyWebpage/pull/104) | compression 1.8.2 | Memory leaks when compressed responses close early |
| [#105](https://github.com/Ali229/MyWebpage/pull/105) | shell-quote 1.12.0 | Shell command injection with specially crafted tokens |
| [#106](https://github.com/Ali229/MyWebpage/pull/106) | source-map-js 1.2.2 | CPU exhaustion when processing crafted source maps |
| [#107](https://github.com/Ali229/MyWebpage/pull/107) | undici 6.29.0 | HTTP response splitting and WebSocket denial of service |
| [#108](https://github.com/Ali229/MyWebpage/pull/108) | postcss-selector-parser 7.1.6 | CPU exhaustion when parsing crafted CSS selectors |
| [#109](https://github.com/Ali229/MyWebpage/pull/109) | Angular CLI and MCP SDK | OAuth credentials sent to an untrusted authorization server |

The final dependency tree stays on the previously installed Angular 21 generation, with updated Angular 21.2 patches and matching build tools. The original manifest requested Angular 22 even though the installed tools and live build used Angular 21. A clean Angular 22 build is incompatible with the current toast library. This review corrects the manifest instead of extending that incomplete framework migration or bypassing peer-dependency checks.

## Additional dependency fixes

- Updated the Angular build tools, including patched piscina. Their webpack-dev-middleware 7.x dependency is outside the vulnerable 8.0–8.2 range.
- Updated Firebase within its existing major version and pinned its transitive `@grpc/grpc-js` dependency to patched version 1.13.6. The two alerts concern certificate authorization information and disclosure of server error messages.
- Required patched qs 6.16.0 to address query-parser denial of service and array-limit bypass.
- Required HTTP cache semantics 4.3.0, outside the advisory's vulnerable range of <=4.2.0, to address possible disclosure of another user's cached responses. Kept the TypeScript 5.9 version supported by the existing build system.
- Added a Reqarr lockfile so deployments install a reproducible dependency set. Its audit reports zero vulnerabilities.
- Corrected outdated test setup: a settings test called a removed lifecycle method, and two component tests lacked route or service mocks. These changes enable validation of the full browser suite without changing product behavior.

## Code scanning

CodeQL alerts [#11](https://github.com/Ali229/MyWebpage/security/code-scanning/11) and [#12](https://github.com/Ali229/MyWebpage/security/code-scanning/12) both flagged download-status route aliases that verify authentication but lacked request limits. Repeated calls could consume authentication and upstream lookup resources.

Both aliases now share a limit of 120 requests per IP per 15 minutes, applied before authentication. This is separate from the existing download-request limit. A live HTTP regression test verifies both aliases return HTTP 429 after the shared allowance is exhausted and that download requests retain their own allowance.

## Remaining upstream limitation

The full development audit reports 11 affected dependency entries, all tracing to one unresolved advisory: [braces stack-exhaustion denial of service, GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

The published braces versions have no patched release at review time. It is brought in by Karma and development tooling. A deeply nested brace pattern can crash the tool processing it. It is absent from the production dependency audit and from Reqarr's dependency tree. The alert has not been dismissed. npm's suggested forced downgrade would replace current Angular build tools with obsolete versions and is not an appropriate fix.

The frontend runtime dependency audit (`npm audit --omit=dev`) and Reqarr audit report zero vulnerabilities. The development audit must not be described as clean while this issue remains.

Build and test validation use a compatible Node 24 runtime in the ignored workspace scratch directory. The machine's default Node version is unchanged.

## Validation

- All 44 browser tests pass with the final compatible dependency set.
- All 18 Reqarr tests pass, including the status-rate-limit regression test.
- The Angular production build passes.
- Production dependency audits for the frontend and Reqarr report zero vulnerabilities.
- The full frontend development audit retains the 11 dependency entries described above, all from the one unpatched braces advisory.

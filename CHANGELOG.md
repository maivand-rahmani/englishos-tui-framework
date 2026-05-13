# englishos-tui-framework

## 0.1.1

### Patch Changes

- [#8](https://github.com/maivand-rahmani/englishos-tui-framework/pull/8) [`3575cc5`](https://github.com/maivand-rahmani/englishos-tui-framework/commit/3575cc5199f68b43aec6c87b4ae57006ce30e406) Thanks [@maivand-rahmani](https://github.com/maivand-rahmani)! - Switch release publishing from beta-tag-only flow to stable latest releases by default, while preserving optional beta publish support.

## 0.1.0

### Minor Changes

- [`d7bf612`](https://github.com/maivand-rahmani/englishos-tui-framework/commit/d7bf6129bef09ddb7dd46a34e45d8c1d813ef6a8) Thanks [@maivand-rahmani](https://github.com/maivand-rahmani)! - Introduce framework hardening for public beta release:

  - add `FrameworkProvider` as canonical provider composition entrypoint
  - add scoped input arbitration with event consumption support
  - make modal props flow available to rendered modal screens
  - move unstable exports under `experimental` namespace
  - prepare dual ESM/CJS packaging metadata for npm publish

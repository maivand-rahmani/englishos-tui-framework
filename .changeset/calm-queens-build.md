---
"runeframe": patch
---

Fix input scope registration churn, add directional region navigation, add opt-in scroll support

- Split useInputRegistration into separate scope lifecycle and handler registration effects to prevent infinite render loops caused by unstable dependency arrays.
- RegionProvider now handles left/right arrow navigation (sidebar↔content) in addition to Tab/Shift+Tab region cycling.
- StepFlow scope isolated to 'stepflow' to prevent arrow conflicts with shell-level region switching.
- AppShell gains opt-in props: `sidebarPosition='fixed'` for absolute sidebar positioning and `scrollContent={true}` for keyboard-driven viewport scrolling (requires fixed sidebar).
- All existing APIs remain backward compatible; new AppShell features are opt-in only.

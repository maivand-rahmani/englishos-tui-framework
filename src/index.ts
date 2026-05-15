// @maivandrahmani/englishos-tui-framework — stable barrel exports
export type * from './types.js'
export * from './constants.js'
export * from './design-system/tokens.js'
export { ThemeProvider, useTheme } from './design-system/ThemeProvider.js'
export { FrameworkProvider } from './FrameworkProvider.js'
export type { FrameworkProviderProps } from './FrameworkProvider.js'
export { AppShell } from './components/AppShell.js'
export type { AppShellProps } from './components/AppShell.js'
export { Panel } from './components/Panel.js'
export type { PanelProps } from './components/Panel.js'
export { Table } from './components/Table.js'
export type { TableProps, Column } from './components/Table.js'
export { Card } from './components/Card.js'
export type { CardProps } from './components/Card.js'
export { Button } from './components/Button.js'
export type { ButtonProps, ButtonVariant } from './components/Button.js'
export { Badge } from './components/Badge.js'
export type { BadgeProps, BadgeVariant } from './components/Badge.js'
export { Section } from './components/Section.js'
export type { SectionProps } from './components/Section.js'
export { Divider } from './components/Divider.js'
export type { DividerProps } from './components/Divider.js'
export { Spacer } from './components/Spacer.js'
export type { SpacerProps } from './components/Spacer.js'
export { EmptyState } from './components/EmptyState.js'
export type { EmptyStateProps } from './components/EmptyState.js'
export { LoadingState } from './components/LoadingState.js'
export type { LoadingStateProps } from './components/LoadingState.js'
export type { ScreenDefinition, ScreenCategory } from './screens/screen.js'
export {
  NavigationProvider,
  useNavigation,
  useNavigationState,
  useNavigationActions,
  useModalState,
  useModalActions,
} from './navigation/NavigationProvider.js'
export type {
  NavigationEntry,
  ModalEntry,
  NavigationContextValue,
  NavigationStateValue,
  NavigationActionsValue,
  ModalStateValue,
  ModalActionsValue,
  NavigationProviderProps,
} from './navigation/NavigationProvider.js'
export { ScreenRegistry } from './screens/registry.js'
export { ScreenProvider, useScreen, ScreenRenderer } from './screens/ScreenProvider.js'
export { StatusBar } from './components/StatusBar.js'
export type { StatusBarProps } from './components/StatusBar.js'
export { HotkeyHintBar } from './components/HotkeyHintBar.js'
export type { HotkeyHintBarProps } from './components/HotkeyHintBar.js'
export { TopBar } from './components/TopBar.js'
export type { TopBarProps } from './components/TopBar.js'
export { Breadcrumbs } from './components/Breadcrumbs.js'
export type { BreadcrumbsProps } from './components/Breadcrumbs.js'
export { Tabs } from './components/Tabs.js'
export type { TabsProps, Tab } from './components/Tabs.js'
export { Sidebar } from './components/Sidebar.js'
export type {
  SidebarProps,
  SidebarItem,
  SidebarSectionTitles,
} from './components/Sidebar.js'
export { KeyboardScopeProvider, useKeyboardScope, useShellSuspension } from './interaction/KeyboardScopeProvider.js'
export type { ScopeStackEntry } from './interaction/KeyboardScopeProvider.js'
export { useInputInScope } from './interaction/useInputInScope.js'
export { useScopedInputInScope } from './interaction/useInputInScope.js'
export type {
  LegacyInputHandler,
  ScopedInputHandler,
  UseInputInScopeOptions,
} from './interaction/useInputInScope.js'
export { FocusScope, useFocusScope } from './interaction/FocusScope.js'
export type { FocusScopeProps, FocusScopeContextValue } from './interaction/FocusScope.js'
export { useFocusable } from './interaction/useFocusable.js'
export type { UseFocusableOptions, UseFocusableResult } from './interaction/useFocusable.js'
export {
  FocusTreeProvider,
  FocusZoneContext,
  useFocusZone,
  useFocusGroup,
  useFocusableV2,
} from './interaction/FocusTreeProvider.js'
export type {
  FocusZoneContextValue,
  FocusGroupContextValue,
  UseFocusZoneOptions,
  UseFocusZoneResult,
  UseFocusGroupOptions,
  UseFocusGroupResult,
  UseFocusableV2Options,
  UseFocusableV2Result,
  FocusTreeProviderProps,
} from './interaction/FocusTreeProvider.js'
export { RegionProvider, useRegionContext, useFocusableRegion } from './interaction/RegionProvider.js'
export type { RegionFocusContextValue, UseFocusableRegionResult, RegionProviderProps } from './interaction/RegionProvider.js'
export { useInputInRegion, useScopedInputInRegion } from './interaction/useInputInRegion.js'
export type { LegacyInputHandler as LegacyRegionInputHandler, ScopedInputHandler as ScopedRegionInputHandler } from './interaction/useInputInRegion.js'
export { ActionRegistry } from './commands/ActionRegistry.js'
export type { Action, ActionMatch } from './commands/ActionRegistry.js'
export {
  ScopedActionRegistryProvider,
  useScopedActionRegistry,
  useRegisterActions,
  useActiveActions,
} from './commands/ScopedActionRegistryProvider.js'
export type {
  ScopedActionRegistryContextValue,
  ScopedActionRegistryProviderProps,
} from './commands/ScopedActionRegistryProvider.js'
export { CommandPalette } from './components/CommandPalette.js'
export type { CommandPaletteProps } from './components/CommandPalette.js'
export { NodeProcessRunner } from './commands/ProcessRunner.js'
export type { ProcessRunner, RunningProcess } from './commands/ProcessRunner.js'
export { useCommandSession } from './commands/useCommandSession.js'
export type {
  CommandSessionMode,
  SessionStatus,
  UseCommandSessionOptions,
  CommandSessionAPI,
  OutputLine,
} from './commands/useCommandSession.js'
export { CommandBar } from './components/CommandBar.js'
export type { CommandBarProps } from './components/CommandBar.js'
export { ProcessOutputPanel } from './components/ProcessOutputPanel.js'
export type { ProcessOutputPanelProps } from './components/ProcessOutputPanel.js'
export { ModalProvider, useModal } from './components/ModalProvider.js'
export type { ModalProviderProps } from './components/ModalProvider.js'
export { ConfirmModal } from './components/ConfirmModal.js'
export type { ConfirmModalProps } from './components/ConfirmModal.js'
export { ConfirmDialog, useConfirmDialog } from './components/ConfirmDialog.js'
export type { ConfirmDialogProps, UseConfirmDialogOptions, UseConfirmDialogResult } from './components/ConfirmDialog.js'
export { InfoModal } from './components/InfoModal.js'
export type { InfoModalProps } from './components/InfoModal.js'
export { ToastProvider, useToast } from './components/ToastProvider.js'
export type { ToastVariant, Toast, ToastResult, ToastContextValue, ToastProviderProps } from './components/ToastProvider.js'
export { List } from './components/List.js'
export type { ListItem, ListProps } from './components/List.js'
export { SearchInput } from './components/SearchInput.js'
export type { SearchInputProps } from './components/SearchInput.js'
export { SelectableList } from './components/SelectableList.js'
export type { SelectableListProps } from './components/SelectableList.js'

export * as experimental from './experimental/index.js'

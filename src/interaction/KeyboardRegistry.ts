import type { FocusScope } from '../types.js'

export interface Keybinding {
  keys: string
  scope: FocusScope
  handler: () => void
  description: string
}

export class KeyboardRegistry {
  private bindings = new Map<string, Keybinding>()

  register(binding: Keybinding): void {
    const key = `${binding.scope}:${binding.keys}`
    if (this.bindings.has(key)) {
      throw new Error(
        `Keybinding "${binding.keys}" for scope "${binding.scope}" is already registered`,
      )
    }
    this.bindings.set(key, binding)
  }

  get(id: string): Keybinding | undefined {
    return this.bindings.get(id)
  }

  getForScope(scope: FocusScope): Keybinding[] {
    return Array.from(this.bindings.values()).filter(
      (b) => b.scope === scope,
    )
  }

  getAll(): Keybinding[] {
    return Array.from(this.bindings.values())
  }

  has(keys: string, scope: FocusScope): boolean {
    return this.bindings.has(`${scope}:${keys}`)
  }

  unregister(keys: string, scope: FocusScope): void {
    const key = `${scope}:${keys}`
    if (!this.bindings.has(key)) {
      throw new Error(
        `Keybinding "${keys}" for scope "${scope}" not found in registry`,
      )
    }
    this.bindings.delete(key)
  }

  getScopePriority(scope: FocusScope): number {
    const priorities: Record<FocusScope, number> = {
      modal: 0,
      command: 1,
      textinput: 2,
      list: 3,
      navigation: 4,
    }
    return priorities[scope]
  }

  getByPriority(): Keybinding[] {
    return this.getAll().sort(
      (a, b) => this.getScopePriority(a.scope) - this.getScopePriority(b.scope),
    )
  }
}

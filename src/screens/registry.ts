import type { ScreenDefinition, ScreenCategory } from './screen.js'

export class ScreenRegistry {
  private screens = new Map<string, ScreenDefinition>()

  register(def: ScreenDefinition): void {
    if (this.screens.has(def.id)) {
      throw new Error(`Screen "${def.id}" is already registered`)
    }
    this.screens.set(def.id, { ...def })
  }

  get(id: string): ScreenDefinition {
    const def = this.screens.get(id)
    if (!def) {
      throw new Error(`Screen "${id}" not found in registry`)
    }
    return def
  }

  has(id: string): boolean {
    return this.screens.has(id)
  }

  getAll(): ScreenDefinition[] {
    return Array.from(this.screens.values())
  }

  getAllByCategory(category: ScreenCategory): ScreenDefinition[] {
    return this.getAll().filter((s) => s.category === category)
  }

  unregister(id: string): void {
    if (!this.screens.has(id)) {
      throw new Error(`Screen "${id}" not found in registry`)
    }
    this.screens.delete(id)
  }
}

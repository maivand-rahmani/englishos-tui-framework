export interface Action {
  id: string
  label: string
  description?: string
  category: string
  handler: () => void
  shortcut?: string
}

export interface ActionMatch {
  action: Action
  score: number
}

function fuzzyScore(query: string, target: string): number {
  if (!query) return 100
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  let score = 0
  let qi = 0
  let prevMatch = -1

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      if (qi === 0) {
        score += t.startsWith(q) ? 30 : 10
      } else {
        score += 5
      }
      if (prevMatch >= 0 && ti === prevMatch + 1) {
        score += 5
      }
      prevMatch = ti
      qi++
    }
  }

  return qi === q.length ? score : 0
}

export class ActionRegistry {
  private actions = new Map<string, Action>()

  register(action: Action): void {
    if (this.actions.has(action.id)) {
      throw new Error(`Action "${action.id}" is already registered`)
    }
    this.actions.set(action.id, { ...action })
  }

  get(id: string): Action | undefined {
    return this.actions.get(id)
  }

  getAll(): Action[] {
    return Array.from(this.actions.values())
  }

  has(id: string): boolean {
    return this.actions.has(id)
  }

  unregister(id: string): void {
    if (!this.actions.has(id)) {
      throw new Error(`Action "${id}" not found in registry`)
    }
    this.actions.delete(id)
  }

  search(query: string): ActionMatch[] {
    if (!query.trim()) {
      return this.getAll().map((a) => ({ action: a, score: 100 }))
    }

    const results: ActionMatch[] = []

    for (const action of this.actions.values()) {
      const score = Math.max(
        fuzzyScore(query, action.label),
        fuzzyScore(query, action.id),
        action.description ? fuzzyScore(query, action.description) : 0,
      )

      if (score > 0) {
        results.push({ action, score })
      }
    }

    return results.sort((a, b) => b.score - a.score)
  }
}

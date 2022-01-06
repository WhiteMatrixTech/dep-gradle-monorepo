export interface dict {
  [key: string]: dict
}

export function getInclude(all: dict, node: string): string[] {
  const include: string[] = []
  for (const key in all[node]) {
    if (Object.prototype.hasOwnProperty.call(all, key)) {
      const element = all[key]
      if (Object.keys(element).length === 0) {
        include.push(key)
        continue
      }
      include.push(...getInclude(all, key))
    }
  }
  return include
}

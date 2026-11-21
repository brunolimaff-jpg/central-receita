/**
 * Memoiza uma normalização de texto. Os modelos normalizam a mesma etapa ou status em cada
 * registro, e com 50 mil linhas o NFD + regex repetido custava centenas de ms na Visão
 * Executiva. Os valores distintos são poucos; o teto só protege contra texto livre.
 */
export function cachedNormalizer(normalize: (value: string) => string, limit = 4096): (value: string) => string {
  const cache = new Map<string, string>()
  return value => {
    let result = cache.get(value)
    if (result === undefined) {
      if (cache.size >= limit) cache.clear()
      result = normalize(value)
      cache.set(value, result)
    }
    return result
  }
}

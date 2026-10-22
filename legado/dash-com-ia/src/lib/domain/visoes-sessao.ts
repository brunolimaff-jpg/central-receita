let visoesSalvas: string[] = []
const assinantes = new Set<() => void>()
const snapshotVazio: string[] = []

export function subscribeVisoesSalvas(assinante: () => void): () => void {
  assinantes.add(assinante)
  return () => assinantes.delete(assinante)
}

export function getVisoesSalvas(): string[] {
  return visoesSalvas
}

export function getServerSnapshotVisoesSalvas(): string[] {
  return snapshotVazio
}

export function alternarVisaoSalva(id: string): void {
  const ids = new Set(visoesSalvas)
  if (ids.has(id)) ids.delete(id)
  else ids.add(id)
  visoesSalvas = [...ids]
  for (const assinante of assinantes) assinante()
}

export function limparVisoesSalvas(): void {
  if (visoesSalvas.length === 0) return
  visoesSalvas = []
  for (const assinante of assinantes) assinante()
}

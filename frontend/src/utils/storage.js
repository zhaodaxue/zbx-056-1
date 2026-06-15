const STORAGE_KEY = 'blast_monitor_snapshots'

export function saveSnapshotToLocal(snapshot) {
  const snapshots = getLocalSnapshots()
  snapshots.unshift(snapshot)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots))
  return snapshot
}

export function getLocalSnapshots() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getLocalSnapshot(id) {
  const snapshots = getLocalSnapshots()
  return snapshots.find(s => s.id === id)
}

export function clearLocalSnapshots() {
  localStorage.removeItem(STORAGE_KEY)
}

export function syncSnapshots(serverSnapshots) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serverSnapshots))
}

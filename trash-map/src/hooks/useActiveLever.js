import { useState, useMemo } from 'react'
import { levers } from '../data/levers'

export function useActiveLever() {
  const [activeLeverId, setActiveLeverId] = useState(null)

  const activeLever = useMemo(
    () => levers.find((l) => l.id === activeLeverId) ?? null,
    [activeLeverId]
  )

  const affectedNodeIds = useMemo(
    () => new Set(activeLever?.affectedNodeIds ?? []),
    [activeLever]
  )

  const affectedEdgeIds = useMemo(
    () => new Set(activeLever?.affectedEdgeIds ?? []),
    [activeLever]
  )

  function toggleLever(id) {
    setActiveLeverId((prev) => (prev === id ? null : id))
  }

  return {
    activeLever,
    activeLeverId,
    affectedNodeIds,
    affectedEdgeIds,
    toggleLever,
  }
}

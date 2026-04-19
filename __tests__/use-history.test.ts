import { renderHook, act } from '@testing-library/react'
import { useHistory } from '../hooks/useHistory'
import type { SavedSession } from '../types'

const mockSession: SavedSession = {
  id: 'sess-1',
  date: Date.now() - 86400000,
  winTarget: 21,
  teamSize: 2,
  teams: [
    { id: 't1', name: 'Team 1', players: [{ id: 'p1', name: 'Alice', emoji: '🏸', rating: 3 }] },
    { id: 't2', name: 'Team 2', players: [{ id: 'p2', name: 'Bob', emoji: '🔥', rating: 3 }] },
  ],
  fixtures: [],
}

describe('useHistory', () => {
  beforeEach(() => localStorage.clear())

  it('starts empty', () => {
    const { result } = renderHook(() => useHistory())
    expect(result.current.history).toHaveLength(0)
  })

  it('saves a session', () => {
    const { result } = renderHook(() => useHistory())
    act(() => result.current.saveSession(mockSession))
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].id).toBe('sess-1')
  })

  it('loads persisted history on mount', () => {
    localStorage.setItem('courtpals_history', JSON.stringify([mockSession]))
    const { result } = renderHook(() => useHistory())
    expect(result.current.history).toHaveLength(1)
  })

  it('clears all history', () => {
    const { result } = renderHook(() => useHistory())
    act(() => result.current.saveSession(mockSession))
    act(() => result.current.clearHistory())
    expect(result.current.history).toHaveLength(0)
    expect(localStorage.getItem('courtpals_history')).toBeNull()
  })

  it('newest session appears first', () => {
    const { result } = renderHook(() => useHistory())
    act(() => result.current.saveSession({ ...mockSession, id: 'old', date: 1000 }))
    act(() => result.current.saveSession({ ...mockSession, id: 'new', date: 9999 }))
    expect(result.current.history[0].id).toBe('new')
  })
})

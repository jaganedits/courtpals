import { renderHook, act } from '@testing-library/react'
import { useRegistry } from '../hooks/useRegistry'
import type { SessionPlayer } from '../types'

const alice: SessionPlayer = { id: 'p1', name: 'Alice', emoji: '🏸', rating: 3 }
const bob: SessionPlayer = { id: 'p2', name: 'Bob', emoji: '🔥', rating: 3 }

describe('useRegistry', () => {
  beforeEach(() => localStorage.clear())

  it('starts empty', () => {
    const { result } = renderHook(() => useRegistry())
    expect(result.current.players).toHaveLength(0)
  })

  it('adds a player', () => {
    const { result } = renderHook(() => useRegistry())
    act(() => result.current.addPlayer(alice))
    expect(result.current.players).toHaveLength(1)
    expect(result.current.players[0].name).toBe('Alice')
  })

  it('removes a player by id', () => {
    const { result } = renderHook(() => useRegistry())
    act(() => result.current.addPlayer(alice))
    act(() => result.current.addPlayer(bob))
    act(() => result.current.removePlayer('p1'))
    expect(result.current.players).toHaveLength(1)
    expect(result.current.players[0].id).toBe('p2')
  })

  it('updates a player', () => {
    const { result } = renderHook(() => useRegistry())
    act(() => result.current.addPlayer(alice))
    act(() => result.current.updatePlayer({ ...alice, name: 'Alicia' }))
    expect(result.current.players[0].name).toBe('Alicia')
  })

  it('persists to localStorage', () => {
    const { result, unmount } = renderHook(() => useRegistry())
    act(() => result.current.addPlayer(alice))
    unmount()
    const { result: r2 } = renderHook(() => useRegistry())
    expect(r2.current.players).toHaveLength(1)
    expect(r2.current.players[0].name).toBe('Alice')
  })
})

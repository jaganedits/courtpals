import { sessionReducer, initialSession } from '../hooks/useSession'
import type { SessionPlayer } from '../types'

const p1: SessionPlayer = { id: 'p1', name: 'Alice', emoji: '🏸' }
const p2: SessionPlayer = { id: 'p2', name: 'Bob', emoji: '🔥' }
const p3: SessionPlayer = { id: 'p3', name: 'Carol', emoji: '🦁' }
const p4: SessionPlayer = { id: 'p4', name: 'Dan', emoji: '⚡' }

function withPlayers(...players: SessionPlayer[]) {
  return players.reduce(
    (s, p) => sessionReducer(s, { type: 'ADD_PLAYER', payload: p }),
    initialSession
  )
}

describe('sessionReducer', () => {
  describe('ADD_PLAYER / REMOVE_PLAYER', () => {
    it('adds a player', () => {
      const s = sessionReducer(initialSession, { type: 'ADD_PLAYER', payload: p1 })
      expect(s.players).toHaveLength(1)
      expect(s.players[0].name).toBe('Alice')
    })

    it('removes a player by id', () => {
      let s = withPlayers(p1, p2)
      s = sessionReducer(s, { type: 'REMOVE_PLAYER', payload: 'p1' })
      expect(s.players).toHaveLength(1)
      expect(s.players[0].id).toBe('p2')
    })
  })

  describe('AUTO_SPLIT_TEAMS', () => {
    it('splits 4 players into 2 teams of 2', () => {
      let s = withPlayers(p1, p2, p3, p4)
      s = sessionReducer(s, { type: 'AUTO_SPLIT_TEAMS' })
      expect(s.teams).toHaveLength(2)
      expect(s.teams[0].players).toHaveLength(2)
      expect(s.teams[1].players).toHaveLength(2)
    })

    it('splits 6 players into 3 teams of 2', () => {
      const players = [p1, p2, p3, p4,
        { id: 'p5', name: 'Eve', emoji: '🌟' },
        { id: 'p6', name: 'Frank', emoji: '💪' }]
      let s = players.reduce((acc, p) => sessionReducer(acc, { type: 'ADD_PLAYER', payload: p }), initialSession)
      s = sessionReducer(s, { type: 'AUTO_SPLIT_TEAMS' })
      expect(s.teams).toHaveLength(3)
      s.teams.forEach(t => expect(t.players).toHaveLength(2))
    })

    it('splits odd number: 3 players into 1 team of 2 + 1 team of 1', () => {
      let s = withPlayers(p1, p2, p3)
      s = sessionReducer(s, { type: 'AUTO_SPLIT_TEAMS' })
      expect(s.teams).toHaveLength(2)
      const sizes = s.teams.map(t => t.players.length).sort()
      expect(sizes).toEqual([1, 2])
    })
  })

  describe('START_SESSION', () => {
    const eightPlayers = [p1, p2, p3, p4,
      { id: 'p5', name: 'Eve', emoji: '🌟' },
      { id: 'p6', name: 'Frank', emoji: '💪' },
      { id: 'p7', name: 'Grace', emoji: '🎯' },
      { id: 'p8', name: 'Henry', emoji: '🚀' }]

    it('generates round-robin fixtures for 4 teams (8 players)', () => {
      let s = eightPlayers.reduce((acc, p) => sessionReducer(acc, { type: 'ADD_PLAYER', payload: p }), initialSession)
      s = sessionReducer(s, { type: 'AUTO_SPLIT_TEAMS' })
      s = sessionReducer(s, { type: 'START_SESSION' })
      expect(s.fixtures).toHaveLength(6)
      expect(s.phase).toBe('active')
    })

    it('generates round-robin fixtures for 3 teams (6 players)', () => {
      const players = [p1, p2, p3, p4,
        { id: 'p5', name: 'Eve', emoji: '🌟' },
        { id: 'p6', name: 'Frank', emoji: '💪' }]
      let s = players.reduce((acc, p) => sessionReducer(acc, { type: 'ADD_PLAYER', payload: p }), initialSession)
      s = sessionReducer(s, { type: 'AUTO_SPLIT_TEAMS' })
      s = sessionReducer(s, { type: 'START_SESSION' })
      expect(s.fixtures).toHaveLength(3)
    })

    it('all fixtures start as pending', () => {
      let s = eightPlayers.reduce((acc, p) => sessionReducer(acc, { type: 'ADD_PLAYER', payload: p }), initialSession)
      s = sessionReducer(s, { type: 'AUTO_SPLIT_TEAMS' })
      s = sessionReducer(s, { type: 'START_SESSION' })
      s.fixtures.forEach(f => expect(f.status).toBe('pending'))
    })
  })

  describe('START_FIXTURE / FINISH_FIXTURE', () => {
    function readySession() {
      const eightPlayers = [p1, p2, p3, p4,
        { id: 'p5', name: 'Eve', emoji: '🌟' },
        { id: 'p6', name: 'Frank', emoji: '💪' },
        { id: 'p7', name: 'Grace', emoji: '🎯' },
        { id: 'p8', name: 'Henry', emoji: '🚀' }]
      let s = eightPlayers.reduce((acc, p) => sessionReducer(acc, { type: 'ADD_PLAYER', payload: p }), initialSession)
      s = sessionReducer(s, { type: 'AUTO_SPLIT_TEAMS' })
      s = sessionReducer(s, { type: 'START_SESSION' })
      return s
    }

    it('marks fixture as active', () => {
      let s = readySession()
      const fid = s.fixtures[0].id
      s = sessionReducer(s, { type: 'START_FIXTURE', payload: fid })
      expect(s.fixtures[0].status).toBe('active')
      expect(s.activeFixtureId).toBe(fid)
    })

    it('marks fixture as done with scores and winner', () => {
      let s = readySession()
      const fixture = s.fixtures[0]
      s = sessionReducer(s, { type: 'START_FIXTURE', payload: fixture.id })
      s = sessionReducer(s, {
        type: 'FINISH_FIXTURE',
        payload: { fixtureId: fixture.id, scoreA: 21, scoreB: 15, winnerId: fixture.teamAId },
      })
      const f = s.fixtures.find(x => x.id === fixture.id)!
      expect(f.status).toBe('done')
      expect(f.scoreA).toBe(21)
      expect(f.scoreB).toBe(15)
      expect(f.winnerId).toBe(fixture.teamAId)
      expect(s.activeFixtureId).toBeNull()
    })
  })

  describe('RESET_SESSION', () => {
    it('returns to initial state', () => {
      let s = withPlayers(p1, p2)
      s = sessionReducer(s, { type: 'RESET_SESSION' })
      expect(s.players).toHaveLength(0)
      expect(s.phase).toBe('setup')
    })
  })
})

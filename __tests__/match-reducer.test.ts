import { matchReducer, initialMatchState } from '../hooks/useMatch'

const startPayload = {
  fixtureId: 'f1',
  teamNames: ['Rockets', 'Vipers'] as [string, string],
  teamEmojis: ['🏸', '🔥'] as [string, string],
  winTarget: 11 as const,
}

describe('matchReducer', () => {
  describe('START_MATCH', () => {
    it('transitions to playing and sets startTime', () => {
      const state = matchReducer(initialMatchState, { type: 'START_MATCH', payload: startPayload })
      expect(state.phase).toBe('playing')
      expect(state.startTime).toBeGreaterThan(0)
      expect(state.winTarget).toBe(11)
      expect(state.teamNames).toEqual(['Rockets', 'Vipers'])
    })
  })

  describe('ADD_POINT', () => {
    function startedState() {
      return matchReducer(initialMatchState, { type: 'START_MATCH', payload: startPayload })
    }

    it('increments team 0 score', () => {
      const s = matchReducer(startedState(), { type: 'ADD_POINT', payload: 0 })
      expect(s.scores).toEqual([1, 0])
    })

    it('increments team 1 score', () => {
      const s = matchReducer(startedState(), { type: 'ADD_POINT', payload: 1 })
      expect(s.scores).toEqual([0, 1])
    })

    it('adds a PointEvent with correct team and scoreAfter', () => {
      const s = matchReducer(startedState(), { type: 'ADD_POINT', payload: 1 })
      expect(s.events).toHaveLength(1)
      expect(s.events[0].team).toBe(1)
      expect(s.events[0].scoreAfter).toEqual([0, 1])
    })

    it('sets winner and finished phase when winTarget reached', () => {
      let s = startedState()
      for (let i = 0; i < 11; i++) s = matchReducer(s, { type: 'ADD_POINT', payload: 0 })
      expect(s.winner).toBe(0)
      expect(s.phase).toBe('finished')
      expect(s.endTime).toBeGreaterThan(0)
    })

    it('does not score after match is finished', () => {
      let s = startedState()
      for (let i = 0; i < 11; i++) s = matchReducer(s, { type: 'ADD_POINT', payload: 0 })
      const after = matchReducer(s, { type: 'ADD_POINT', payload: 1 })
      expect(after.scores[1]).toBe(0)
    })

    it('does not score when idle', () => {
      const s = matchReducer(initialMatchState, { type: 'ADD_POINT', payload: 0 })
      expect(s.scores).toEqual([0, 0])
    })
  })

  describe('UNDO', () => {
    it('reverses the last point', () => {
      let s = matchReducer(initialMatchState, { type: 'START_MATCH', payload: startPayload })
      s = matchReducer(s, { type: 'ADD_POINT', payload: 0 })
      s = matchReducer(s, { type: 'UNDO' })
      expect(s.scores).toEqual([0, 0])
      expect(s.events).toHaveLength(0)
    })

    it('restores playing phase if undoing the winning point', () => {
      let s = matchReducer(initialMatchState, { type: 'START_MATCH', payload: startPayload })
      for (let i = 0; i < 11; i++) s = matchReducer(s, { type: 'ADD_POINT', payload: 0 })
      s = matchReducer(s, { type: 'UNDO' })
      expect(s.phase).toBe('playing')
      expect(s.winner).toBeNull()
    })

    it('does nothing when no events', () => {
      let s = matchReducer(initialMatchState, { type: 'START_MATCH', payload: startPayload })
      s = matchReducer(s, { type: 'UNDO' })
      expect(s.scores).toEqual([0, 0])
    })
  })

  describe('RESET', () => {
    it('returns to idle with zeroed state', () => {
      let s = matchReducer(initialMatchState, { type: 'START_MATCH', payload: startPayload })
      s = matchReducer(s, { type: 'ADD_POINT', payload: 0 })
      s = matchReducer(s, { type: 'RESET' })
      expect(s.phase).toBe('idle')
      expect(s.scores).toEqual([0, 0])
      expect(s.events).toHaveLength(0)
    })
  })
})

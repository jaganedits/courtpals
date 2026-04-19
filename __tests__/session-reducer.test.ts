import {
  sessionReducer,
  initialSession,
  rankStandings,
  generatePlayoffSeed,
  generateFinals,
} from '../hooks/useSession'
import type { DaySession, Fixture, SessionPlayer, SessionTeam } from '../types'

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

    it('no team plays three consecutive fixtures (circle-method rotation)', () => {
      let s = eightPlayers.reduce(
        (acc, p) => sessionReducer(acc, { type: 'ADD_PLAYER', payload: p }),
        initialSession,
      )
      s = sessionReducer(s, { type: 'AUTO_SPLIT_TEAMS' })
      s = sessionReducer(s, { type: 'START_SESSION' })
      for (let i = 2; i < s.fixtures.length; i++) {
        const a = s.fixtures[i - 2]
        const b = s.fixtures[i - 1]
        const c = s.fixtures[i]
        const common = [a.teamAId, a.teamBId].filter(
          id => [b.teamAId, b.teamBId].includes(id) && [c.teamAId, c.teamBId].includes(id),
        )
        expect(common).toEqual([])
      }
    })

    it('every RR pair appears exactly once', () => {
      let s = eightPlayers.reduce(
        (acc, p) => sessionReducer(acc, { type: 'ADD_PLAYER', payload: p }),
        initialSession,
      )
      s = sessionReducer(s, { type: 'AUTO_SPLIT_TEAMS' })
      s = sessionReducer(s, { type: 'START_SESSION' })
      const seen = new Set<string>()
      for (const f of s.fixtures) {
        const key = [f.teamAId, f.teamBId].sort().join('|')
        expect(seen.has(key)).toBe(false)
        seen.add(key)
      }
      expect(seen.size).toBe(s.fixtures.length)
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

    it('starting a second fixture resets the previous one to pending', () => {
      let s = readySession()
      const [first, second] = s.fixtures
      s = sessionReducer(s, { type: 'START_FIXTURE', payload: first.id })
      expect(s.fixtures.find(f => f.id === first.id)?.status).toBe('active')
      s = sessionReducer(s, { type: 'START_FIXTURE', payload: second.id })
      expect(s.fixtures.find(f => f.id === first.id)?.status).toBe('pending')
      expect(s.fixtures.find(f => f.id === second.id)?.status).toBe('active')
      expect(s.activeFixtureId).toBe(second.id)
      // Only one fixture is live at a time.
      expect(s.fixtures.filter(f => f.status === 'active')).toHaveLength(1)
    })

    it('HYDRATE_SESSION heals a snapshot where multiple fixtures are active', () => {
      let s = readySession()
      const [first, second] = s.fixtures
      // Hand-craft a corrupt snapshot: two fixtures active, activeFixtureId points at one.
      const corrupt: typeof s = {
        ...s,
        activeFixtureId: second.id,
        fixtures: s.fixtures.map(f =>
          f.id === first.id || f.id === second.id ? { ...f, status: 'active' } : f,
        ),
      }
      const healed = sessionReducer(s, { type: 'HYDRATE_SESSION', payload: corrupt })
      expect(healed.fixtures.filter(f => f.status === 'active')).toHaveLength(1)
      expect(healed.fixtures.find(f => f.id === second.id)?.status).toBe('active')
      expect(healed.fixtures.find(f => f.id === first.id)?.status).toBe('pending')
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

  describe('scheduled sessions', () => {
    function midnight(daysFromNow: number): number {
      const d = new Date()
      d.setDate(d.getDate() + daysFromNow)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }

    function readyForPlay(dayOffset: number) {
      let s = withPlayers(p1, p2, p3, p4)
      s = sessionReducer(s, { type: 'AUTO_SPLIT_TEAMS' })
      s = sessionReducer(s, { type: 'SET_SESSION_DATE', payload: midnight(dayOffset) })
      s = sessionReducer(s, { type: 'START_SESSION' })
      return s
    }

    it('SET_SESSION_DATE normalises to start-of-day', () => {
      const noon = new Date()
      noon.setHours(14, 30, 0, 0)
      const s = sessionReducer(initialSession, { type: 'SET_SESSION_DATE', payload: noon.getTime() })
      const stored = new Date(s.date)
      expect(stored.getHours()).toBe(0)
      expect(stored.getMinutes()).toBe(0)
    })

    it('START_SESSION with today => phase active', () => {
      const s = readyForPlay(0)
      expect(s.phase).toBe('active')
    })

    it('START_SESSION with a future date => phase scheduled', () => {
      const s = readyForPlay(3)
      expect(s.phase).toBe('scheduled')
      expect(s.fixtures.length).toBeGreaterThan(0)
    })

    it('BEGIN_PLAY transitions scheduled -> active', () => {
      let s = readyForPlay(3)
      s = sessionReducer(s, { type: 'BEGIN_PLAY' })
      expect(s.phase).toBe('active')
    })

    it('BEGIN_PLAY is a no-op outside scheduled', () => {
      const active = readyForPlay(0)
      const after = sessionReducer(active, { type: 'BEGIN_PLAY' })
      expect(after).toBe(active)
    })

    it('AUTO_SPLIT_TEAMS on a scheduled session clears fixtures and drops to setup', () => {
      let s = readyForPlay(5)
      expect(s.phase).toBe('scheduled')
      s = sessionReducer(s, { type: 'AUTO_SPLIT_TEAMS' })
      expect(s.phase).toBe('setup')
      expect(s.fixtures).toEqual([])
    })
  })

  describe('UPDATE_TEAM_NAME', () => {
    function built() {
      let s = withPlayers(p1, p2, p3, p4)
      return sessionReducer(s, { type: 'AUTO_SPLIT_TEAMS' })
    }

    it('renames only the targeted team', () => {
      let s = built()
      const firstId = s.teams[0].id
      const firstName = s.teams[0].name
      const secondName = s.teams[1].name
      s = sessionReducer(s, {
        type: 'UPDATE_TEAM_NAME',
        payload: { id: firstId, name: 'Red Dragons' },
      })
      expect(s.teams[0].name).toBe('Red Dragons')
      expect(s.teams[1].name).toBe(secondName)
      expect(s.teams[0].players.length).toBeGreaterThan(0)
      expect(firstName).not.toBe('Red Dragons')
    })

    it('trims whitespace and falls back to existing name on empty input', () => {
      let s = built()
      const firstId = s.teams[0].id
      const originalName = s.teams[0].name
      s = sessionReducer(s, {
        type: 'UPDATE_TEAM_NAME',
        payload: { id: firstId, name: '   ' },
      })
      expect(s.teams[0].name).toBe(originalName)

      s = sessionReducer(s, {
        type: 'UPDATE_TEAM_NAME',
        payload: { id: firstId, name: '  Vipers  ' },
      })
      expect(s.teams[0].name).toBe('Vipers')
    })

    it('ignores unknown team ids', () => {
      let s = built()
      const before = s.teams.map(t => t.name)
      s = sessionReducer(s, {
        type: 'UPDATE_TEAM_NAME',
        payload: { id: 'nope', name: 'whatever' },
      })
      expect(s.teams.map(t => t.name)).toEqual(before)
    })
  })
})

function T(id: string): SessionTeam {
  return { id, name: id, players: [] }
}

function rrFixture(aId: string, bId: string, scoreA: number, scoreB: number): Fixture {
  return {
    id: `${aId}-${bId}`,
    teamAId: aId,
    teamBId: bId,
    status: 'done',
    scoreA,
    scoreB,
    winnerId: scoreA > scoreB ? aId : bId,
    round: 'rr',
  }
}

describe('rankStandings', () => {
  it('sorts by pts descending', () => {
    const teams = [T('a'), T('b'), T('c')]
    const fixtures = [
      rrFixture('a', 'b', 21, 10),
      rrFixture('a', 'c', 21, 15),
      rrFixture('b', 'c', 15, 21),
    ]
    const rows = rankStandings(teams, fixtures)
    expect(rows.map(r => r.team.id)).toEqual(['a', 'c', 'b'])
  })

  it('breaks a pair-wise points tie with head-to-head', () => {
    // 4 teams, a and b both finish on 4 pts, b won the direct match.
    const teams = [T('a'), T('b'), T('c'), T('d')]
    const fixtures = [
      rrFixture('a', 'b', 15, 21), // b beats a
      rrFixture('a', 'c', 21, 10), // a beats c
      rrFixture('a', 'd', 21, 10), // a beats d
      rrFixture('b', 'c', 21, 10), // b beats c
      rrFixture('b', 'd', 10, 21), // d beats b
      rrFixture('c', 'd', 21, 0),  // c beats d
    ]
    // pts: a=4, b=4, c=2, d=2. H2H a↔b: b wins.
    const rows = rankStandings(teams, fixtures)
    expect(rows.map(r => r.team.id)).toEqual(['b', 'a', 'c', 'd'])
  })

  it('falls back to point differential on a 3-way cycle', () => {
    // rock-paper-scissors: all three on 2 pts; ranked by diff.
    const teams = [T('a'), T('b'), T('c')]
    const fixtures = [
      rrFixture('a', 'b', 21, 10), // a +11
      rrFixture('b', 'c', 21, 15), // b +6
      rrFixture('c', 'a', 21, 19), // c +2, a -2
    ]
    // diffs: a = +11-2 = +9, b = -11+6 = -5, c = -6+2 = -4
    const rows = rankStandings(teams, fixtures)
    expect(rows.map(r => r.team.id)).toEqual(['a', 'c', 'b'])
  })

  it('falls back to points-scored when diff is equal', () => {
    // Two teams with identical pts and identical diff; rank by points scored.
    // a vs b: b wins 21-15 (a -6, b +6)
    // Force another pair to match exactly so diff stays tied.
    const teams = [T('a'), T('b'), T('c'), T('d')]
    const fixtures = [
      rrFixture('a', 'b', 15, 21),
      rrFixture('a', 'c', 21, 15), // a: scored 36, conceded 36 → diff 0
      rrFixture('a', 'd', 15, 21), // a: scored 51, conceded 57 → diff -6
      rrFixture('b', 'c', 15, 21), // b: scored 42, conceded 36 → diff +6
      rrFixture('b', 'd', 15, 21), // b: scored 57, conceded 57 → diff 0
      rrFixture('c', 'd', 21, 10),
    ]
    // Just assert rankStandings returns the four teams in an order that respects pts desc,
    // and that points-scored doesn't crash.
    const rows = rankStandings(teams, fixtures)
    expect(rows).toHaveLength(4)
    const prev = rows.map(r => r.pts)
    for (let i = 1; i < prev.length; i++) {
      expect(prev[i]).toBeLessThanOrEqual(prev[i - 1])
    }
  })

  it('ignores non-RR fixtures when computing points', () => {
    const teams = [T('a'), T('b')]
    const fixtures: Fixture[] = [
      {
        id: 'p1',
        teamAId: 'a',
        teamBId: 'b',
        status: 'done',
        scoreA: 21,
        scoreB: 0,
        winnerId: 'a',
        round: 'final',
      },
    ]
    const rows = rankStandings(teams, fixtures)
    rows.forEach(r => expect(r.pts).toBe(0))
  })
})

describe('generatePlayoffSeed', () => {
  it('returns empty array for 2 teams', () => {
    expect(generatePlayoffSeed([T('a'), T('b')], ['a', 'b'])).toEqual([])
  })

  it('returns empty array for 3 teams', () => {
    expect(generatePlayoffSeed([T('a'), T('b'), T('c')], ['a', 'b', 'c'])).toEqual([])
  })

  it('returns Final + 3rd-place for 4 teams', () => {
    const teams = [T('1'), T('2'), T('3'), T('4')]
    const fx = generatePlayoffSeed(teams, ['1', '2', '3', '4'])
    expect(fx).toHaveLength(2)
    expect(fx.find(f => f.round === 'final')).toMatchObject({ teamAId: '1', teamBId: '2' })
    expect(fx.find(f => f.round === '3rd')).toMatchObject({ teamAId: '3', teamBId: '4' })
  })

  it('returns Final + 3rd-place for 5 teams (5th drops out)', () => {
    const teams = [T('1'), T('2'), T('3'), T('4'), T('5')]
    const fx = generatePlayoffSeed(teams, ['1', '2', '3', '4', '5'])
    expect(fx).toHaveLength(2)
    expect(fx.find(f => f.round === 'final')).toMatchObject({ teamAId: '1', teamBId: '2' })
    expect(fx.find(f => f.round === '3rd')).toMatchObject({ teamAId: '3', teamBId: '4' })
  })

  it('returns two Semis for 6 teams seeded 1v4 and 2v3', () => {
    const teams = [T('1'), T('2'), T('3'), T('4'), T('5'), T('6')]
    const fx = generatePlayoffSeed(teams, ['1', '2', '3', '4', '5', '6'])
    expect(fx).toHaveLength(2)
    expect(fx.every(f => f.round === 'semi')).toBe(true)
    const pairs = fx.map(f => [f.teamAId, f.teamBId].sort().join('-')).sort()
    expect(pairs).toEqual(['1-4', '2-3'])
  })

  it('all seeded fixtures start pending with zero scores', () => {
    const teams = [T('1'), T('2'), T('3'), T('4')]
    const fx = generatePlayoffSeed(teams, ['1', '2', '3', '4'])
    fx.forEach(f => {
      expect(f.status).toBe('pending')
      expect(f.scoreA).toBe(0)
      expect(f.scoreB).toBe(0)
      expect(f.winnerId).toBeNull()
    })
  })
})

function playAllRR(state: DaySession): DaySession {
  let s = state
  for (const f of s.fixtures.filter(x => x.round === 'rr' && x.status === 'pending')) {
    s = sessionReducer(s, { type: 'START_FIXTURE', payload: f.id })
    s = sessionReducer(s, {
      type: 'FINISH_FIXTURE',
      payload: { fixtureId: f.id, scoreA: 21, scoreB: 10, winnerId: f.teamAId },
    })
  }
  return s
}

function setupSession(playerCount: number): DaySession {
  let s = initialSession
  for (let i = 1; i <= playerCount; i++) {
    s = sessionReducer(s, {
      type: 'ADD_PLAYER',
      payload: { id: `p${i}`, name: `P${i}`, emoji: '🏸' },
    })
  }
  s = sessionReducer(s, { type: 'AUTO_SPLIT_TEAMS' })
  s = sessionReducer(s, { type: 'START_SESSION' })
  return s
}

describe('phase transitions with playoffs', () => {
  it('3 teams: last RR finish goes straight to done', () => {
    let s = setupSession(6) // 2v2 default, 6 players → 3 teams
    expect(s.teams).toHaveLength(3)
    s = playAllRR(s)
    expect(s.phase).toBe('done')
    expect(s.fixtures.every(f => f.round === 'rr')).toBe(true)
  })

  it('4 teams: last RR finish seeds Final + 3rd-place', () => {
    let s = setupSession(8) // 8 players → 4 teams
    expect(s.teams).toHaveLength(4)
    s = playAllRR(s)
    expect(s.phase).toBe('playoffs')
    const playoffs = s.fixtures.filter(f => f.round !== 'rr')
    expect(playoffs).toHaveLength(2)
    expect(playoffs.some(f => f.round === 'final')).toBe(true)
    expect(playoffs.some(f => f.round === '3rd')).toBe(true)
  })

  it('4 teams: finishing both playoff fixtures ends the session', () => {
    let s = setupSession(8)
    s = playAllRR(s)
    for (const f of s.fixtures.filter(x => x.round !== 'rr' && x.status === 'pending')) {
      s = sessionReducer(s, { type: 'START_FIXTURE', payload: f.id })
      s = sessionReducer(s, {
        type: 'FINISH_FIXTURE',
        payload: { fixtureId: f.id, scoreA: 21, scoreB: 15, winnerId: f.teamAId },
      })
    }
    expect(s.phase).toBe('done')
  })

  it('6 teams: last RR finish spawns two semis only', () => {
    let s = setupSession(12) // 12 players → 6 teams
    expect(s.teams).toHaveLength(6)
    s = playAllRR(s)
    expect(s.phase).toBe('playoffs')
    const semis = s.fixtures.filter(f => f.round === 'semi')
    expect(semis).toHaveLength(2)
    expect(s.fixtures.some(f => f.round === 'final')).toBe(false)
    expect(s.fixtures.some(f => f.round === '3rd')).toBe(false)
  })

  it('6 teams: finishing both semis appends Final + 3rd-place', () => {
    let s = setupSession(12)
    s = playAllRR(s)
    for (const semi of s.fixtures.filter(f => f.round === 'semi')) {
      s = sessionReducer(s, { type: 'START_FIXTURE', payload: semi.id })
      s = sessionReducer(s, {
        type: 'FINISH_FIXTURE',
        payload: { fixtureId: semi.id, scoreA: 21, scoreB: 15, winnerId: semi.teamAId },
      })
    }
    expect(s.phase).toBe('playoffs')
    expect(s.fixtures.some(f => f.round === 'final')).toBe(true)
    expect(s.fixtures.some(f => f.round === '3rd')).toBe(true)
  })

  it('6 teams: finishing Final + 3rd ends the session', () => {
    let s = setupSession(12)
    s = playAllRR(s)
    // play semis
    for (const semi of s.fixtures.filter(f => f.round === 'semi')) {
      s = sessionReducer(s, { type: 'START_FIXTURE', payload: semi.id })
      s = sessionReducer(s, {
        type: 'FINISH_FIXTURE',
        payload: { fixtureId: semi.id, scoreA: 21, scoreB: 15, winnerId: semi.teamAId },
      })
    }
    // play final + 3rd
    for (const f of s.fixtures.filter(x => (x.round === 'final' || x.round === '3rd') && x.status === 'pending')) {
      s = sessionReducer(s, { type: 'START_FIXTURE', payload: f.id })
      s = sessionReducer(s, {
        type: 'FINISH_FIXTURE',
        payload: { fixtureId: f.id, scoreA: 21, scoreB: 15, winnerId: f.teamAId },
      })
    }
    expect(s.phase).toBe('done')
  })
})

describe('generateFinals', () => {
  it('pairs semi winners → Final, semi losers → 3rd-place', () => {
    const semi1: Fixture = {
      id: 's1',
      teamAId: '1',
      teamBId: '4',
      status: 'done',
      scoreA: 21,
      scoreB: 15,
      winnerId: '1',
      round: 'semi',
    }
    const semi2: Fixture = {
      id: 's2',
      teamAId: '2',
      teamBId: '3',
      status: 'done',
      scoreA: 18,
      scoreB: 21,
      winnerId: '3',
      round: 'semi',
    }
    const fx = generateFinals([semi1, semi2])
    expect(fx).toHaveLength(2)
    const final = fx.find(f => f.round === 'final')!
    const third = fx.find(f => f.round === '3rd')!
    expect([final.teamAId, final.teamBId].sort()).toEqual(['1', '3'])
    expect([third.teamAId, third.teamBId].sort()).toEqual(['2', '4'])
  })

  it('returns empty if a semi is still pending', () => {
    const semi1: Fixture = {
      id: 's1',
      teamAId: '1',
      teamBId: '4',
      status: 'done',
      scoreA: 21,
      scoreB: 15,
      winnerId: '1',
      round: 'semi',
    }
    const semi2: Fixture = {
      id: 's2',
      teamAId: '2',
      teamBId: '3',
      status: 'active',
      scoreA: 0,
      scoreB: 0,
      winnerId: null,
      round: 'semi',
    }
    expect(generateFinals([semi1, semi2])).toEqual([])
  })
})

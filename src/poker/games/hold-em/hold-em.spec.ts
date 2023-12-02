import { HoldEm } from './hold-em'
import { ActionState } from './hold-em.types'

describe('Hold\'em poker', () => {
  describe('defaults', () => {
    let state: ActionState
    beforeEach(() => {
      state = new HoldEm().getState()
    })
    it('creates a new hand with 0 events', () => {
      expect(state.phase).toBe('preflop')
      expect(state.communityCards.length).toBe(0)
      expect(state.events.length).toBe(0)
    })
    it('creates 2 active players by default', () => {
      expect(state.players.length).toBe(2)
      expect(state.players[0].active).toBe(true)
      expect(state.players[1].active).toBe(true)
      expect(state.currentPlayer).toBe(0)
    })
    it('makes player purses 100 by default, moving 1 and 2 for blinds to the pot', () => {
      expect(state.players[0].purse).toBe(99)
      expect(state.players[1].purse).toBe(98)
      expect(state.pots.length).toBe(1)
      expect(state.pots[0].players).toEqual([0, 1])
      expect(state.pots[0].amount).toEqual(3)
    })
    it('makes min and max bet amounts be "no limit" by default', () => {
      expect(state.minBet).toBe(4)
      expect(state.maxBet).toBe(Number.MAX_VALUE)
    })
  })
  describe('blinds', () => {
    it('allows a custom small blind to be defined', () => {
      const state = new HoldEm({ smallBlind: 17 }).getState()
      expect(state.players[0].purse).toBe(83)
      expect(state.pots[0].amount).toBeGreaterThanOrEqual(17)
    })
    it('defines the large blind as twice the small blind by default', () => {
      const state = new HoldEm({ smallBlind: 5 }).getState()
      expect(state.players[0].purse).toBe(95)
      expect(state.players[1].purse).toBe(90)
      expect(state.pots[0].amount).toBe(15)
    })
    it('allows a custom large blind to be defined', () => {
      const state = new HoldEm({ largeBlind: 16 }).getState()
      expect(state.players[1].purse).toBe(84)
      expect(state.pots[0].amount).toBeGreaterThanOrEqual(16)
    })
    it('defines the small blind as half the large blind by default', () => {
      const state = new HoldEm({ largeBlind: 16 }).getState()
      expect(state.players[0].purse).toBe(92)
      expect(state.players[1].purse).toBe(84)
      expect(state.pots[0].amount).toBe(24)
    })
  })
})

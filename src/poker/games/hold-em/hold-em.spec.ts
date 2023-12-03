import { errors } from './errors'
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
    it('makes bet amount be "no limit" by default', () => {
      expect(state.minBet).toBe(4)
      expect(state.maxBet).toBe(Number.MAX_VALUE)
    })
    it('allows maximum 3 raises per betting round', () => {
      expect(state.maxRaisesPerRound).toBe(3)
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
    it('does now allow the small blind to be less than 0', () => {
      const state = new HoldEm({ smallBlind: -5 }).getState()
      expect(state.players[0].purse).toBe(100)
      expect(state.players[1].purse).toBe(98)
      expect(state.pots[0].amount).toBe(2)
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
    it('does now allow the large blind to be less than 0', () => {
      const state = new HoldEm({ largeBlind: -15 }).getState()
      expect(state.players[0].purse).toBe(99)
      expect(state.players[1].purse).toBe(100)
      expect(state.pots[0].amount).toBe(1)
    })
  })
  describe('max raises', () => {
    it('allows max raises per betting round to be customized', () => {
      const state = new HoldEm({ maxRaisesPerRound: 999 }).getState()
      expect(state.maxRaisesPerRound).toBe(999)
    })
    it('does not max raises per betting round to be less than 0', () => {
      const state = new HoldEm({ maxRaisesPerRound: -5 }).getState()
      expect(state.maxRaisesPerRound).toBe(0)
    })
  })
  describe('betting limits', () => {
    describe('none', () => {
      it('makes the min bet be twice the large blind', () => {
        const state = new HoldEm({ largeBlind: 10, limit: 'none' }).getState()
        expect(state.minBet).toBe(20)
      })
    })
    describe('fixed', () => {
      it('makes both the min and max bet be twice the large blind', () => {
        const state = new HoldEm({ largeBlind: 10, limit: 'fixed' }).getState()
        expect(state.minBet).toBe(20)
        expect(state.maxBet).toBe(20)
      })
    })
    describe('pot', () => {
      it('makes the min bet as large as the large blind', () => {
        const state = new HoldEm({ largeBlind: 10, limit: 'pot' }).getState()
        expect(state.minBet).toBe(10)
      })
      it('makes the max bet as large as the pot', () => {
        const state = new HoldEm({ smallBlind: 5, largeBlind: 10, limit: 'pot' }).getState()
        expect(state.maxBet).toBe(15)
      })
    })
  })
  describe('players', () => {
    it('allows up to 22 players with the turn given to the third player (after the blinds)', () => {
      const hand = new HoldEm({ players: Array.from(Array(100)) })
      const state = hand.getState()
      expect(state.players.length).toBe(22)
      state.players.forEach((player, index) => {
        expect(player.active).toBe(true)
        if (index === 0) {
          expect(player.purse).toBe(99)
        } else if (index === 1) {
          expect(player.purse).toBe(98)
        } else {
          expect(player.purse).toBe(100)
        }
      })
      expect(state.currentPlayer).toBe(2)
    })
    it('allows cards for any player to be retrieved', () => {
      const hand = new HoldEm({ players: Array.from(Array(22)) })
      hand.getState().players.forEach((_, index) => {
        const cards = hand.getCardsForPlayer(index)
        expect(cards?.[0]).toBeTruthy()
        expect(cards?.[1]).toBeTruthy()
      })
    })
    it('allows players to be initialized with a custom purse', () => {
      const intendedPlayers = Array.from(Array(22)).map(() => ({
        purse: Math.round(Math.random() * 1000) + 200
      }))
      const state = new HoldEm({ players: intendedPlayers, smallBlind: 10, largeBlind: 20 }).getState()
      expect(state.players.length).toBe(22)
      state.players.forEach((player, index) => {
        if (index === 0) {
          expect(player.purse).toBe(intendedPlayers[index].purse - 10)
        } else if (index === 1) {
          expect(player.purse).toBe(intendedPlayers[index].purse - 20)
        } else {
          expect(player.purse).toBe(intendedPlayers[index].purse)
        }
      })
    })
  })
  describe('game play', () => {
    it('returns an error if bet is less than the min bet', () => {
      const hand = new HoldEm()
      const result = hand.act({ action: 'bet', amount: 2 })
      expect(result.error?.message).toBe(errors.lessThanMinBet.replace('$1', `${hand.getState().minBet}`))
    })
    it('returns an error if bet is greater than the max bet', () => {
      const hand = new HoldEm({ limit: 'fixed' })
      const result = hand.act({ action: 'bet', amount: 999 })
      expect(result.error?.message).toBe(errors.greaterThanMaxBet.replace('$1', `${hand.getState().maxBet}`))
    })
  })
})

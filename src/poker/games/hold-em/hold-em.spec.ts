import { DEFAULT_LARGE_BLIND, DEFAULT_PLAYER_PURSE, DEFAULT_SMALL_BLIND } from './constants'
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
    it(`makes player purses ${DEFAULT_PLAYER_PURSE} by default, moving ${DEFAULT_SMALL_BLIND} and ${DEFAULT_LARGE_BLIND} for blinds to the pot`, () => {
      expect(state.players[0].currentBet).toBe(DEFAULT_SMALL_BLIND)
      expect(state.players[1].currentBet).toBe(DEFAULT_LARGE_BLIND)
      expect(state.players[0].purse).toBe(DEFAULT_PLAYER_PURSE - DEFAULT_SMALL_BLIND)
      expect(state.players[1].purse).toBe(DEFAULT_PLAYER_PURSE - DEFAULT_LARGE_BLIND)
      expect(state.pots.length).toBe(1)
      expect(state.pots[0].players).toEqual([0, 1])
      expect(state.pots[0].amount).toEqual(DEFAULT_SMALL_BLIND + DEFAULT_LARGE_BLIND)
      expect(state.currentBet).toBe(DEFAULT_LARGE_BLIND)
    })
    it('makes bet amount be "no limit" by default', () => {
      expect(state.minBet).toBe(DEFAULT_LARGE_BLIND * 2)
      expect(state.maxBet).toBe(Number.MAX_VALUE)
    })
    it('allows maximum 3 raises per betting round', () => {
      expect(state.maxRaisesPerRound).toBe(3)
    })
  })
  describe('blinds', () => {
    it('allows a custom small blind to be defined', () => {
      const state = new HoldEm({ smallBlind: 17 }).getState()
      expect(state.players[0].currentBet).toBe(17)
      expect(state.players[0].purse).toBe(DEFAULT_PLAYER_PURSE - 17)
    })
    it('defines the large blind as twice the small blind by default', () => {
      const state = new HoldEm({ smallBlind: 5 }).getState()
      expect(state.players[0].currentBet).toBe(5)
      expect(state.players[1].currentBet).toBe(10)
      expect(state.players[0].purse).toBe(DEFAULT_PLAYER_PURSE - 5)
      expect(state.players[1].purse).toBe(DEFAULT_PLAYER_PURSE - 10)
      expect(state.pots[0].amount).toBe(15)
      expect(state.pots[0].players).toEqual([0, 1])
      expect(state.currentBet).toBe(10)
    })
    it('does now allow the small blind to be less than 0', () => {
      const state = new HoldEm({ smallBlind: -5 }).getState()
      expect(state.players[0].currentBet).toBe(0)
      expect(state.players[1].currentBet).toBe(DEFAULT_LARGE_BLIND)
      expect(state.players[0].purse).toBe(DEFAULT_PLAYER_PURSE)
      expect(state.players[1].purse).toBe(DEFAULT_PLAYER_PURSE - DEFAULT_LARGE_BLIND)
      expect(state.pots[0].amount).toBe(DEFAULT_LARGE_BLIND)
      expect(state.pots[0].players).toEqual([0, 1])
    })
    it('allows a custom large blind to be defined', () => {
      const state = new HoldEm({ largeBlind: 16 }).getState()
      expect(state.players[1].currentBet).toBe(16)
      expect(state.players[1].purse).toBe(DEFAULT_PLAYER_PURSE - 16)
      expect(state.pots[0].amount).toBeGreaterThanOrEqual(16)
      expect(state.currentBet).toBe(16)
    })
    it('defines the small blind as half the large blind by default', () => {
      const state = new HoldEm({ largeBlind: 16 }).getState()
      expect(state.players[0].currentBet).toBe(8)
      expect(state.players[1].currentBet).toBe(16)
      expect(state.players[0].purse).toBe(DEFAULT_PLAYER_PURSE - 8)
      expect(state.players[1].purse).toBe(DEFAULT_PLAYER_PURSE - 16)
      expect(state.pots[0].amount).toBe(24)
      expect(state.pots[0].players).toEqual([0, 1])
    })
    it('does now allow the large blind to be less than 0', () => {
      const state = new HoldEm({ largeBlind: -15 }).getState()
      expect(state.players[0].currentBet).toBe(DEFAULT_SMALL_BLIND)
      expect(state.players[1].currentBet).toBe(DEFAULT_SMALL_BLIND)
      expect(state.players[0].purse).toBe(DEFAULT_PLAYER_PURSE - DEFAULT_SMALL_BLIND)
      expect(state.players[1].purse).toBe(DEFAULT_PLAYER_PURSE - DEFAULT_SMALL_BLIND)
      expect(state.pots[0].amount).toBe(DEFAULT_SMALL_BLIND + DEFAULT_SMALL_BLIND)
      expect(state.pots[0].players).toEqual([0, 1])
      expect(state.currentBet).toBe(DEFAULT_SMALL_BLIND)
    })
    it('does not allow the large blind to be less than the small blind', () => {
      const state = new HoldEm({ smallBlind: 10, largeBlind: 5 }).getState()
      expect(state.players[0].currentBet).toBe(10)
      expect(state.players[1].currentBet).toBe(10)
      expect(state.players[0].purse).toBe(DEFAULT_PLAYER_PURSE - 10)
      expect(state.players[1].purse).toBe(DEFAULT_PLAYER_PURSE - 10)
      expect(state.pots[0].amount).toBe(20)
      expect(state.pots[0].players).toEqual([0, 1])
      expect(state.currentBet).toBe(10)
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
          expect(player.currentBet).toBe(DEFAULT_SMALL_BLIND)
          expect(player.purse).toBe(DEFAULT_PLAYER_PURSE - DEFAULT_SMALL_BLIND)
        } else if (index === 1) {
          expect(player.currentBet).toBe(DEFAULT_LARGE_BLIND)
          expect(player.purse).toBe(DEFAULT_PLAYER_PURSE - DEFAULT_LARGE_BLIND)
        } else {
          expect(player.currentBet).toBe(0)
          expect(player.purse).toBe(DEFAULT_PLAYER_PURSE)
        }
      })
      expect(state.currentPlayer).toBe(2)
      expect(state.pots[0].players).toEqual([0, 1])
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
    it('returns an error if act is "check" when bet must be matched', () => {
      const hand = new HoldEm()
      const result = hand.act({ action: 'check' })
      expect(result.error?.message).toBe(errors.checkNotAllowed)
    })
    it('updates the player state and pot on "fold"', () => {
      const hand = new HoldEm()
      const result = hand.act({ action: 'fold' })
      expect(result.error).toBeUndefined()
      expect(result.players[0].purse).toBe(DEFAULT_PLAYER_PURSE - DEFAULT_SMALL_BLIND)
      expect(result.pots[0].amount).toBe(DEFAULT_SMALL_BLIND + DEFAULT_LARGE_BLIND)
      expect(result.pots[0].players).toEqual([1])
    })
    it('ends the hand when only one player has not folded', () => {
      const hand = new HoldEm()
      hand.act({ action: 'fold' })
      expect(hand.getState().phase).toBe('complete')
    })
    it('updates the pot and player purse on successful "call"', () => {
      const hand = new HoldEm()
      const result = hand.act({ action: 'call' })
      expect(result.currentPlayer).toBe(1)
      expect(result.error).toBeUndefined()
      expect(result.players[0].purse).toBe(DEFAULT_PLAYER_PURSE - DEFAULT_LARGE_BLIND)
      expect(result.pots[0].amount).toBe(DEFAULT_LARGE_BLIND + DEFAULT_LARGE_BLIND)
      expect(result.pots[0].players).toEqual([0, 1])
    })
    it('updates the pot and player purse on successful "raise"', () => {
      const hand = new HoldEm()
      const state = hand.getState()
      const callAmount = state.currentBet - DEFAULT_SMALL_BLIND
      const result = hand.act({ action: 'raise', amount: callAmount + state.minBet })
      expect(result.error).toBeUndefined()
      expect(result.players[0].purse).toBe(DEFAULT_PLAYER_PURSE - DEFAULT_LARGE_BLIND - state.minBet)
      expect(result.pots[0].amount).toBe(DEFAULT_LARGE_BLIND + DEFAULT_LARGE_BLIND + state.minBet)
      expect(result.pots[0].players).toEqual([0, 1])
    })
    it('returns an error if act if "bet" but amount not defined', () => {
      const hand = new HoldEm()
      const result = hand.act({ action: 'bet' })
      expect(result.error?.message).toBe(errors.missingAmount)
    })
    it('returns an error if act if "raise" but amount not defined', () => {
      const hand = new HoldEm()
      const result = hand.act({ action: 'raise' })
      expect(result.error?.message).toBe(errors.missingAmount)
    })
    it('returns an error if bet is less than the min bet', () => {
      const hand = new HoldEm()
      const result = hand.act({ action: 'bet', amount: hand.getState().minBet - 1 })
      expect(result.error?.message).toBe(errors.lessThanMinBet.replace('$1', `${hand.getState().minBet}`))
    })
    it('returns an error if bet is less than the min bet', () => {
      const hand = new HoldEm()
      const result = hand.act({ action: 'raise', amount: hand.getState().minBet - 1 })
      expect(result.error?.message).toBe(errors.lessThanMinBet.replace('$1', `${hand.getState().minBet}`))
    })
    it('returns an error if bet is greater than the min bet but not including the call amount', () => {
      const hand = new HoldEm()
      const state = hand.getState()
      const callAmount = state.currentBet - state.players[state.currentPlayer].currentBet
      const result = hand.act({ action: 'raise', amount: hand.getState().minBet })
      expect(callAmount).toBeGreaterThan(0)
      expect(result.error?.message).toBe(errors.lessThanMinBet.replace('$1', `${hand.getState().minBet}`))
    })
    it('returns an error if bet is greater than the max bet', () => {
      const hand = new HoldEm({ limit: 'fixed' })
      const result = hand.act({ action: 'bet', amount: hand.getState().minBet + 999 })
      expect(result.error?.message).toBe(errors.greaterThanMaxBet.replace('$1', `${hand.getState().maxBet}`))
    })
    it('returns an error if raise is greater than the max bet', () => {
      const hand = new HoldEm({ limit: 'fixed' })
      const result = hand.act({ action: 'raise', amount: hand.getState().minBet + 999 })
      expect(result.error?.message).toBe(errors.greaterThanMaxBet.replace('$1', `${hand.getState().maxBet}`))
    })
  })
})

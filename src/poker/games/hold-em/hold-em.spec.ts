import { DEFAULT_LARGE_BLIND, DEFAULT_PLAYER_PURSE, DEFAULT_SMALL_BLIND } from './constants'
import { errors } from './errors'
import { HoldEm } from './hold-em'
import { ActionState, HoldEmConstructor } from './hold-em.types'

describe('Hold\'em poker', () => {
  describe('defaults', () => {
    let hand: HoldEm
    let state: ActionState
    beforeEach(() => {
      hand = new HoldEm()
      state = hand.getState()
    })
    it('creates a new hand with 0 events', () => {
      expect(state.round).toBe('preflop')
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
      expect(state.pots[0]).toEqual([DEFAULT_SMALL_BLIND, DEFAULT_LARGE_BLIND])
      expect(hand.getPotTotal(0)).toEqual(DEFAULT_SMALL_BLIND + DEFAULT_LARGE_BLIND)
    })
    it('makes bet amount be "no limit" by default', () => {
      expect(state.minBet).toBe(DEFAULT_LARGE_BLIND * 2)
      expect(state.maxBet).toBe(Number.MAX_VALUE)
    })
  })
  describe('(contrived) setup', () => {
    const rounds: HoldEmConstructor['round'][] = ['preflop', 'flop', 'turn', 'river', 'complete']
    rounds.forEach(round => {
      it(`can be started at ${round}`, () => {
        const state = new HoldEm({ round }).getState()
        expect(state.round).toBe(round)
      })
    })
    it('shows 0 community cards if the round is preflop', () => {
      const state = new HoldEm({ round: 'preflop' }).getState()
      expect(state.communityCards.length).toBe(0)
    })
    it('shows 3 community cards if the round is flop', () => {
      const state = new HoldEm({ round: 'flop' }).getState()
      expect(state.communityCards.length).toBe(3)
    })
    it('shows 4 community cards if the round is turn', () => {
      const state = new HoldEm({ round: 'turn' }).getState()
      expect(state.communityCards.length).toBe(4)
    })
    it('shows 5 community cards if the round is river', () => {
      const state = new HoldEm({ round: 'river' }).getState()
      expect(state.communityCards.length).toBe(5)
    })
    it('allows community cards to be pre-selected', () => {
      const state = new HoldEm({
        communityCards: ['AC', 'AD', 'AH', 'AS', '2C'],
        round: 'river',
      }).getState()
      expect(state.communityCards).toEqual(['AC', 'AD', 'AH', 'AS', '2C'])
    })
    it('allows the min bet and max bet to be customized', () => {
      const state = new HoldEm({ minBet: 37, maxBet: 77 }).getState()
      expect(state.minBet).toBe(37)
      expect(state.maxBet).toBe(77)
    })
    it('allows the current player to be customized', () => {
      const state = new HoldEm({ currentPlayer: 1 }).getState()
      expect(state.currentPlayer).toBe(1)
    })
    it('throws if the current player does not exist', () => {
      expect(() => new HoldEm({ currentPlayer: 3 })).toThrow()
    })
    it('throws if the current player is not active', () => {
      expect(() => new HoldEm({ currentPlayer: 0, players: [{ active: false }] })).toThrow()
    })
    it('allows players to be customized', () => {
      const hand = new HoldEm({
        largeBlind: 50,
        players: [{}, { cards: ['KH', '7D'], purse: 777, active: false, chanceToBet: true }],
      })
      expect(hand.getState().players[1]).toEqual({ purse: 727, active: false, currentBet: 50, chanceToBet: true })
      expect(hand.getCardsForPlayer(1)).toEqual(['KH', '7D'])
    })
    it('allows pots to be customized', () =>{
      const state = new HoldEm({
        players: Array.from(Array(3)),
        pots: [[77, 700], [100]],
      }).getState()
      expect(state.pots[0]).toEqual([77, 700, 0])
      expect(state.pots[1]).toEqual([100, 0, 0])
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
      expect(state.pots[0]).toEqual([5, 10])
    })
    it('does now allow the small blind to be less than 0', () => {
      const state = new HoldEm({ smallBlind: -5 }).getState()
      expect(state.players[0].currentBet).toBe(0)
      expect(state.players[1].currentBet).toBe(DEFAULT_LARGE_BLIND)
      expect(state.players[0].purse).toBe(DEFAULT_PLAYER_PURSE)
      expect(state.players[1].purse).toBe(DEFAULT_PLAYER_PURSE - DEFAULT_LARGE_BLIND)
      expect(state.pots[0]).toEqual([0, DEFAULT_LARGE_BLIND])
    })
    it('allows a custom large blind to be defined', () => {
      const hand = new HoldEm({ largeBlind: 16 })
      const state = hand.getState()
      expect(state.players[1].currentBet).toBe(16)
      expect(state.players[1].purse).toBe(DEFAULT_PLAYER_PURSE - 16)
      expect(hand.getPotTotal(0)).toBeGreaterThanOrEqual(16)
    })
    it('defines the small blind as half the large blind by default', () => {
      const hand = new HoldEm({ largeBlind: 16 })
      const state = hand.getState()
      expect(state.players[0].currentBet).toBe(8)
      expect(state.players[1].currentBet).toBe(16)
      expect(state.players[0].purse).toBe(DEFAULT_PLAYER_PURSE - 8)
      expect(state.players[1].purse).toBe(DEFAULT_PLAYER_PURSE - 16)
      expect(hand.getPotTotal(0)).toBe(24)
      expect(state.pots[0]).toEqual([8, 16])
    })
    it('does now allow the large blind to be less than 0', () => {
      const hand = new HoldEm({ largeBlind: -15 })
      const state = hand.getState()
      expect(state.players[0].currentBet).toBe(DEFAULT_SMALL_BLIND)
      expect(state.players[1].currentBet).toBe(DEFAULT_SMALL_BLIND)
      expect(state.players[0].purse).toBe(DEFAULT_PLAYER_PURSE - DEFAULT_SMALL_BLIND)
      expect(state.players[1].purse).toBe(DEFAULT_PLAYER_PURSE - DEFAULT_SMALL_BLIND)
      expect(hand.getPotTotal(0)).toBe(DEFAULT_SMALL_BLIND + DEFAULT_SMALL_BLIND)
      expect(state.pots[0]).toEqual([DEFAULT_SMALL_BLIND, DEFAULT_SMALL_BLIND])
    })
    it('does not allow the large blind to be less than the small blind', () => {
      const hand = new HoldEm({ smallBlind: 10, largeBlind: 5 })
      const state = hand.getState()
      expect(state.players[0].currentBet).toBe(10)
      expect(state.players[1].currentBet).toBe(10)
      expect(state.players[0].purse).toBe(DEFAULT_PLAYER_PURSE - 10)
      expect(state.players[1].purse).toBe(DEFAULT_PLAYER_PURSE - 10)
      expect(hand.getPotTotal(0)).toBe(20)
      expect(state.pots[0]).toEqual([10, 10])
    })
  })
  describe('max raises', () => {
    // TODO via actually making raises squentially
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
      const potPlayers = [DEFAULT_SMALL_BLIND, DEFAULT_LARGE_BLIND]
      for (let i = 2; i < 22; i++) {
        potPlayers[i] = 0
      }
      expect(state.pots[0]).toEqual(potPlayers)
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
      expect(hand.getPotTotal(0)).toBe(DEFAULT_SMALL_BLIND + DEFAULT_LARGE_BLIND)
      expect(result.pots[0]).toEqual([DEFAULT_SMALL_BLIND, DEFAULT_LARGE_BLIND])
    })
    it('ends the hand when only one player has not folded', () => {
      const hand = new HoldEm()
      hand.act({ action: 'fold' })
      expect(hand.getState().round).toBe('complete')
    })
    it('updates the pot and player purse on successful "call"', () => {
      const hand = new HoldEm()
      const result = hand.act({ action: 'call' })
      expect(result.currentPlayer).toBe(1)
      expect(result.error).toBeUndefined()
      expect(result.players[0].purse).toBe(DEFAULT_PLAYER_PURSE - DEFAULT_LARGE_BLIND)
      expect(hand.getPotTotal(0)).toBe(DEFAULT_LARGE_BLIND + DEFAULT_LARGE_BLIND)
      expect(result.pots[0]).toEqual([DEFAULT_LARGE_BLIND, DEFAULT_LARGE_BLIND])
    })
    it('updates the pot and player purse on successful "raise"', () => {
      const hand = new HoldEm()
      const state = hand.getState()
      const callAmount = DEFAULT_LARGE_BLIND - DEFAULT_SMALL_BLIND
      const result = hand.act({ action: 'raise', amount: callAmount + state.minBet })
      expect(result.error).toBeUndefined()
      expect(result.players[0].purse).toBe(DEFAULT_PLAYER_PURSE - DEFAULT_LARGE_BLIND - state.minBet)
      expect(hand.getPotTotal(0)).toBe(DEFAULT_LARGE_BLIND + DEFAULT_LARGE_BLIND + state.minBet)
      expect(result.pots[0]).toEqual([DEFAULT_LARGE_BLIND + state.minBet, DEFAULT_LARGE_BLIND])
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
      const callAmount = DEFAULT_LARGE_BLIND - state.players[state.currentPlayer].currentBet
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
    it('continues preflop round until all players have had a chnace to bet', () => {
      const hand = new HoldEm()
      const state1 = hand.getState()
      expect(state1.players[0].chanceToBet).toBe(false)
      expect(state1.players[1].chanceToBet).toBe(false)
      expect(state1.currentPlayer).toBe(0)
      expect(state1.round).toBe('preflop')
      hand.act({ action: 'call' })
      const state2 = hand.getState()
      expect(state2.players[0].chanceToBet).toBe(true)
      expect(state2.players[1].chanceToBet).toBe(false)
      expect(state2.currentPlayer).toBe(1)
      expect(state2.round).toBe('preflop')
      hand.act({ action: 'check' })
      const state3 = hand.getState()
      expect(state3.error).toBeUndefined()
      expect(state3.pots[0]).toEqual([DEFAULT_LARGE_BLIND, DEFAULT_LARGE_BLIND])
      expect(state3.players[0].chanceToBet).toBe(true)
      expect(state3.players[1].chanceToBet).toBe(true)
      expect(state3.currentPlayer).toBe(0)
      expect(state3.round).toBe('flop')
    })
  })
})

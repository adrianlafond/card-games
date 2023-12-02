import { takeCard, shuffle, Deck, CardKey } from '../../../cards'
import { ActionState, HoldEmConstructor, Player, State } from './hold-em.types'

export class HoldEm {
  private readonly state: State

  constructor (options?: HoldEmConstructor) {
    const deck = shuffle()
    const players = this.definePlayers(deck, options?.players)
    const smallBlind = options?.smallBlind ?? (options?.largeBlind != null ? options.largeBlind / 2 : 1)
    const largeBlind = options?.largeBlind ?? (options?.smallBlind != null ? options.smallBlind * 2 : 2)
    const limit = options?.limit ?? 'none'
    this.state = {
      deck,
      players,
      currentPlayer: 2 % players.length,
      pots: [{
        players: [0, 1],
        amount: 0
      }],
      phase: 'preflop',
      minBet: this.getMinBet(limit, largeBlind),
      maxBet: this.getMaxBet(limit, largeBlind, smallBlind + largeBlind),
      community: [takeCard(deck), takeCard(deck), takeCard(deck), takeCard(deck), takeCard(deck)],
      smallBlind,
      largeBlind,
      limit
    }
  }

  getState (): ActionState {
    let community: [CardKey?, CardKey?, CardKey?, CardKey?, CardKey?] = []
    if (this.state.phase === 'flop') {
      community = [this.state.community[0], this.state.community[1], this.state.community[2]]
    } else if (this.state.phase === 'turn') {
      community = [this.state.community[0], this.state.community[1], this.state.community[2], this.state.community[3]]
    } else if (this.state.phase === 'river' || this.state.phase === 'showdown') {
      community = [this.state.community[0], this.state.community[1], this.state.community[2], this.state.community[3], this.state.community[4]]
    }
    return {
      currentPlayer: this.state.currentPlayer,
      players: this.state.players.map(player => ({
        purse: player.purse,
        active: player.active
      })),
      pots: this.state.pots.map(pot => ({
        ...pot,
        players: [...pot.players]
      })),
      phase: this.state.phase,
      minBet: this.state.minBet,
      maxBet: this.state.maxBet,
      community
    }
  }

  private definePlayers (deck: Deck, optionsPlayers?: HoldEmConstructor['players']): Player[] {
    const players: Player[] = (optionsPlayers != null ? optionsPlayers?.slice(0, 23) : []).map(
      item => this.createPlayer(deck, item.purse)
    )
    while (players.length < 2) {
      players.push(this.createPlayer(deck))
    }
    return players
  }

  private createPlayer (deck: Deck, purse?: number): Player {
    return {
      cards: [takeCard(deck), takeCard(deck)],
      purse: purse ?? 100,
      active: true
    }
  }

  private getMinBet (limit: State['limit'], blind: number): number {
    if (limit === 'pot') {
      return blind
    }
    return blind * 2
  }

  private getMaxBet (limit: State['limit'], blind: number, pot: number): number {
    if (limit === 'pot') {
      return pot
    }
    if (limit === 'fixed') {
      return blind * 2
    }
    return Number.MAX_VALUE
  }
}

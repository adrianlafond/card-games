import { takeCard, shuffle, Deck, CardKey } from '../../../cards'
import { errors } from './errors'
import { ActionState, HoldEmConstructor, Player, PlayerAction, State } from './hold-em.types'

export class HoldEm {
  private readonly state: State

  constructor (options?: HoldEmConstructor) {
    const deck = shuffle()
    const [smallBlind, largeBlind] = this.defineBlinds(options)
    const limit = options?.limit ?? 'none'
    const players = this.definePlayers(deck, options?.players)
    players[0].purse = Math.max(0, players[0].purse - smallBlind)
    players[1].purse = Math.max(0, players[1].purse - largeBlind)
    this.state = {
      deck,
      players,
      currentPlayer: 2 % players.length,
      pots: [{
        players: [0, 1],
        amount: smallBlind + largeBlind
      }],
      phase: 'preflop',
      maxRaisesPerRound: options?.maxRaisesPerRound != null ? Math.max(0, options?.maxRaisesPerRound) : 3,
      minBet: this.defineMinBet(limit, largeBlind),
      maxBet: this.defineMaxBet(limit, largeBlind, smallBlind + largeBlind),
      communityCards: this.drawCommunityCards(deck),
      smallBlind,
      largeBlind,
      limit
    }
  }

  getCardsForPlayer (player: number): [CardKey, CardKey] | null {
    return player in this.state.players ? [...this.state.players[player].cards] : null
  }

  getState (): ActionState {
    let communityCards: [CardKey?, CardKey?, CardKey?, CardKey?, CardKey?] = []
    if (this.state.phase === 'flop') {
      communityCards = [this.state.communityCards[0], this.state.communityCards[1], this.state.communityCards[2]]
    } else if (this.state.phase === 'turn') {
      communityCards = [this.state.communityCards[0], this.state.communityCards[1], this.state.communityCards[2], this.state.communityCards[3]]
    } else if (this.state.phase === 'river' || this.state.phase === 'showdown') {
      communityCards = [this.state.communityCards[0], this.state.communityCards[1], this.state.communityCards[2], this.state.communityCards[3], this.state.communityCards[4]]
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
      maxRaisesPerRound: this.state.maxRaisesPerRound,
      minBet: this.state.minBet,
      maxBet: this.state.maxBet,
      communityCards
    }
  }

  act (action: PlayerAction): ActionState {
    const result = this.getState()
    if ((action.action === 'raise' || action.action === 'bet')) {
      if (action.amount < this.state.minBet) {
        result.error = {
          message: errors.lessThanMinBet.replace('$1', `${this.state.minBet}`)
        }
      } else if (action.amount > this.state.maxBet) {
        result.error = {
          message: errors.greaterThanMaxBet.replace('$1', `${this.state.maxBet}`)
        }
      }
    }
    return result
  }

  private definePlayers (deck: Deck, optionsPlayers?: HoldEmConstructor['players']): Player[] {
    const players: Player[] = (optionsPlayers != null ? optionsPlayers.slice(0, 22) : []).map(
      item => this.createPlayer(deck, item?.purse)
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

  private defineBlinds (options?: HoldEmConstructor): [number, number] {
    const blinds: [number, number] = [0, 0]
    if (options?.smallBlind != null) {
      blinds[0] = Math.max(0, options?.smallBlind)
    } else if (options?.largeBlind != null && options.largeBlind > 0) {
      blinds[0] = Math.max(0, options.largeBlind) / 2
    } else {
      blinds[0] = 1
    }
    if (options?.largeBlind != null) {
      blinds[1] = Math.max(0, options?.largeBlind)
    } else if (options?.smallBlind != null && options.smallBlind > 0) {
      blinds[1] = Math.max(0, options.smallBlind) * 2
    } else {
      blinds[1] = 2
    }
    return blinds
  }

  private defineMinBet (limit: State['limit'], blind: number): number {
    if (limit === 'pot') {
      return blind
    }
    return blind * 2
  }

  private defineMaxBet (limit: State['limit'], blind: number, pot: number): number {
    if (limit === 'pot') {
      return pot
    }
    if (limit === 'fixed') {
      return blind * 2
    }
    return Number.MAX_VALUE
  }

  private drawCommunityCards (deck: Deck): State['communityCards'] {
    const communityCards: Deck = []
    takeCard(deck) // burn
    communityCards.push(takeCard(deck)) // flop 1
    communityCards.push(takeCard(deck)) // flop 2
    communityCards.push(takeCard(deck)) // flop 3
    takeCard(deck) // burn
    communityCards.push(takeCard(deck)) // turn
    takeCard(deck) // burn
    communityCards.push(takeCard(deck)) // river
    return communityCards as State['communityCards']
  }
}

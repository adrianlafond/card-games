import { takeCard, shuffle, Deck, CardKey } from '../../../cards'
import { DEFAULT_LARGE_BLIND, DEFAULT_PLAYER_PURSE, DEFAULT_SMALL_BLIND } from './constants'
import { errors } from './errors'
import { ActionError, ActionState, HoldEmConstructor, Player, PlayerAction, State } from './hold-em.types'

export class HoldEm {
  private readonly state: State

  constructor (options?: HoldEmConstructor) {
    const deck = shuffle()
    const [smallBlind, largeBlind] = this.defineBlinds(options)
    const limit = options?.limit ?? 'none'
    const players = this.definePlayers(deck, options?.players)
    players[0].currentBet = smallBlind
    players[1].currentBet = largeBlind
    players[0].purse = Math.max(0, players[0].purse - smallBlind)
    players[1].purse = Math.max(0, players[1].purse - largeBlind)
    this.state = {
      deck,
      players,
      currentPlayer: 2 % players.length,
      currentBet: largeBlind,
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
      isPreflopFirstPass: true,
      raisesMade: 0,
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
    } else if (this.state.phase === 'river' || this.state.phase === 'complete') {
      communityCards = [this.state.communityCards[0], this.state.communityCards[1], this.state.communityCards[2], this.state.communityCards[3], this.state.communityCards[4]]
    }
    return {
      currentPlayer: this.state.currentPlayer,
      currentBet: this.state.currentBet,
      players: this.state.players.map(player => ({
        currentBet: player.currentBet,
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
      raiseAllowed: this.state.raisesMade < this.state.maxRaisesPerRound,
      communityCards
    }
  }

  act (action: PlayerAction): ActionState {
    switch (action.action) {
      case 'fold':
        return this.processFold()
      case 'check':
        return this.processCheck()
      case 'call':
        return this.processCall()
      case 'bet':
        return this.processBet(action?.amount)
      case 'raise':
        return this.processRaise(action?.amount)
      default:
        return this.getState()
    }
  }

  private processFold (): ActionState {
    const currentPlayer = this.state.players[this.state.currentPlayer]
    currentPlayer.active = false
    this.state.pots.forEach(pot => {
      const index = pot.players.findIndex(i => i === this.state.currentPlayer)
      pot.players.splice(index, 1)
    })
    this.concludeAction()
    return this.getState()
  }

  private processCheck (): ActionState {
    const errorResult = this.generateCheckError()
    if (errorResult != null) {
      return errorResult
    }
    this.concludeAction()
    return this.getState()
  }

  private generateCheckError (): ActionState | null {
    if (this.state.currentBet > 0) {
      return this.getErrorResult({ message: errors.checkNotAllowed })
    }
    return null
  }

  private processCall (): ActionState {
    const errorResult = this.generateCallError()
    if (errorResult != null) {
      return errorResult
    }
    const currentPlayer = this.state.players[this.state.currentPlayer]
    const callAmount = this.state.currentBet - currentPlayer.currentBet
    currentPlayer.currentBet += callAmount
    currentPlayer.purse -= callAmount
    this.state.pots[this.state.pots.length - 1].amount += callAmount
    this.concludeAction()
    return this.getState()
  }

  private generateCallError (): ActionState | null {
    return null
  }

  private processBet (amount?: number): ActionState {
    const errorResult = this.generateBetOrRaiseError(amount)
    if (errorResult != null) {
      return errorResult
    }
    this.concludeAction()
    return this.getState()
  }

  private processRaise (amount?: number): ActionState {
    const errorResult = this.generateBetOrRaiseError(amount)
    if (errorResult != null) {
      return errorResult
    }
    const requiredAmount = amount ?? 0
    const currentPlayer = this.state.players[this.state.currentPlayer]
    const callAmount = this.state.currentBet - currentPlayer.currentBet

    if (requiredAmount < callAmount + this.state.minBet) {
      const errorResult = this.generateBetOrRaiseError(0)
      if (errorResult != null) {
        return errorResult
      }
    }

    currentPlayer.currentBet += requiredAmount
    currentPlayer.purse -= requiredAmount
    this.state.pots[this.state.pots.length - 1].amount += requiredAmount
    this.concludeAction()
    return this.getState()
  }

  private generateBetOrRaiseError (amount?: number): ActionState | null {
    if (amount == null) {
      return this.getErrorResult({ message: errors.missingAmount })
    }
    if (amount < this.state.minBet) {
      return this.getErrorResult({ message: errors.lessThanMinBet.replace('$1', `${this.state.minBet}`) })
    } else if (amount > this.state.maxBet) {
      return this.getErrorResult({ message: errors.greaterThanMaxBet.replace('$1', `${this.state.maxBet}`) })
    }
    return null
  }

  /**
   * After an action has been taken successfully by a player (fold, call, bet,
   * or raise), then the turn moves to the next player and the state of the hand
   * is reviewed to determine if the phase sould updated (e.g., flop to turn) or
   * if the hand is complete.
   */
  private concludeAction (): void {
    if (this.state.players.filter(player => player.active).length === 1) {
      // Complete the hand if only 1 player left.
      this.state.phase = 'complete'
    }
    const prevCurrentPlayer = this.state.currentPlayer
    this.makeNextPlayerCurrent()
    if (this.state.currentPlayer < prevCurrentPlayer) {
      const playersNeedChanceToCall = this.state.players.some(player => player.active && player.currentBet < this.state.currentBet)
      if (playersNeedChanceToCall || this.state.isPreflopFirstPass) {
        this.state.isPreflopFirstPass = false
      } else if (this.state.phase === 'preflop') {
        this.state.phase = 'flop'
      } else if (this.state.phase === 'flop') {
        this.state.phase = 'turn'
      } else if (this.state.phase === 'turn') {
        this.state.phase = 'river'
      } else if (this.state.phase === 'river') {
        this.state.phase = 'complete'
        // shown > compare hands, remove losers from pots
      }
    }
  }

  /**
   * If hand is still being played, pass the turn to the next player who is still active.
   */
  private makeNextPlayerCurrent (): void {
    if (this.state.phase !== 'complete') {
      const n = (this.state.currentPlayer + 1) % this.state.players.length
      while (n !== this.state.currentPlayer) {
        if (this.state.players[n].active) {
          this.state.currentPlayer = n
          break
        }
      }
    }
  }

  private getErrorResult (error: ActionError): ActionState {
    const result = this.getState()
    result.error = error
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
      purse: purse ?? DEFAULT_PLAYER_PURSE,
      currentBet: 0,
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
      blinds[0] = DEFAULT_SMALL_BLIND
    }
    if (options?.largeBlind != null) {
      blinds[1] = Math.max(0, options?.largeBlind)
    } else if (options?.smallBlind != null && options.smallBlind > 0) {
      blinds[1] = Math.max(0, options.smallBlind) * 2
    } else {
      blinds[1] = DEFAULT_LARGE_BLIND
    }
    blinds[1] = Math.max(blinds[0], blinds[1])
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

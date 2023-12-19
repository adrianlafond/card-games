import { takeCard, shuffle, Deck, CardKey } from '../../../cards'
import { sortHands } from '../../hands'
import { DEFAULT_LARGE_BLIND, DEFAULT_PLAYER_PURSE, DEFAULT_SMALL_BLIND } from './constants'
import { errors } from './errors'
import { ActionError, ActionState, HoldEmConstructor, Player, PlayerAction, Pot, Round, State } from './hold-em.types'

export class HoldEm {
  private readonly state: State

  constructor (options?: HoldEmConstructor) {
    const deck = shuffle()
    this.removePreselectedCards(deck)
    const [smallBlind, largeBlind] = this.defineBlinds(options)
    const limit = options?.limit ?? 'none'
    const [minBet, maxBet] = this.defineBetLimits(limit, smallBlind, largeBlind, options)
    const players = this.definePlayers(deck, options)
    const round = options?.round ?? 'preflop'
    if (round === 'preflop') {
      players[0].currentBet = smallBlind
      players[1].currentBet = largeBlind
      players[0].purse = Math.max(0, players[0].purse - smallBlind)
      players[1].purse = Math.max(0, players[1].purse - largeBlind)
    }
    this.state = {
      deck,
      players,
      currentPlayer: options?.currentPlayer ?? (round === 'preflop' ? 2 % players.length : 0),
      pots: this.definePots(players, options?.pots),
      round,
      maxRaisesPerRound: options?.maxRaisesPerRound != null ? Math.max(0, options?.maxRaisesPerRound) : 3,
      minBet,
      maxBet,
      communityCards: this.drawCommunityCards(deck, options?.communityCards),
      smallBlind,
      largeBlind,
      isPreflopFirstPass: true,
      raisesMade: 0,
      limit
    }
    this.checkInitialSetup()
  }

  /**
   * Returns the hole cards of a player for @param index.
   */
  getCardsForPlayer (index: number): [CardKey, CardKey] | null {
    return this.state.players[index] != null ? [...this.state.players[index].cards] : null
  }

  /**
   * Returns the total amount in a pot by summing the bets contributed by each player.
   */
  getPotTotal (index: number): number {
    const total = this.state.pots?.[index]?.reduce((sum, n) => sum + n, 0)
    return total != null ? total : 0
  }

  getState (): ActionState {
    let communityCards: [CardKey?, CardKey?, CardKey?, CardKey?, CardKey?] = []
    if (this.state.round === 'flop') {
      communityCards = [this.state.communityCards[0], this.state.communityCards[1], this.state.communityCards[2]]
    } else if (this.state.round === 'turn') {
      communityCards = [this.state.communityCards[0], this.state.communityCards[1], this.state.communityCards[2], this.state.communityCards[3]]
    } else if (this.state.round === 'river' || this.state.round === 'complete') {
      communityCards = [this.state.communityCards[0], this.state.communityCards[1], this.state.communityCards[2], this.state.communityCards[3], this.state.communityCards[4]]
    }
    return {
      currentPlayer: this.state.currentPlayer,
      players: this.state.players.map(player => ({
        active: player.active,
        chanceToBet: player.chanceToBet,
        currentBet: player.currentBet,
        purse: player.purse,
        ...(player.showdown && { showdown: player.showdown }),
      })),
      pots: this.state.pots.map(pot => ([...pot])),
      round: this.state.round,
      minBet: this.state.minBet,
      maxBet: this.state.maxBet,
      raiseAllowed: this.state.round !== 'complete' && this.state.raisesMade < this.state.maxRaisesPerRound,
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
    currentPlayer.chanceToBet = true
    this.concludeAction()
    return this.getState()
  }

  private processCheck (): ActionState {
    const errorResult = this.generateCheckError()
    if (errorResult != null) {
      return errorResult
    }
    const currentPlayer = this.state.players[this.state.currentPlayer]
    currentPlayer.chanceToBet = true
    this.concludeAction()
    return this.getState()
  }

  private generateCheckError (): ActionState | null {
    if (this.getHighestBet() > this.state.players[this.state.currentPlayer].currentBet) {
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
    const callAmount = this.getHighestBet() - currentPlayer.currentBet
    currentPlayer.currentBet += callAmount
    currentPlayer.purse -= callAmount
    currentPlayer.chanceToBet = true
    this.concludeAction()
    return this.getState()
  }

  private generateCallError (): ActionState | null {
    return null
  }

  private processBet (amount?: number): ActionState {
    return this.processRaise(amount, true)
  }

  private processRaise (amount?: number, isBet?: boolean): ActionState {
    const errorResult = this.generateBetOrRaiseError(amount)
    if (errorResult != null) {
      return errorResult
    }
    const requiredAmount = amount ?? 0
    const currentPlayer = this.state.players[this.state.currentPlayer]
    const callAmount = this.getHighestBet() - currentPlayer.currentBet

    if (requiredAmount < callAmount + this.state.minBet) {
      const errorResult = this.generateBetOrRaiseError(0)
      if (errorResult != null) {
        return errorResult
      }
    }

    if (!isBet) {
      this.state.raisesMade += 1
    }
    currentPlayer.currentBet += requiredAmount
    currentPlayer.purse -= requiredAmount
    currentPlayer.chanceToBet = true
    this.concludeAction()
    return this.getState()
  }

  private generateBetOrRaiseError (amount?: number): ActionState | null {
    if (this.state.raisesMade >= this.state.maxRaisesPerRound) {
      return this.getErrorResult({ message: errors.maxRaisesReached })
    }
    if (amount == null) {
      return this.getErrorResult({ message: errors.missingAmount })
    }
    if (amount < this.state.minBet) {
      return this.getErrorResult({ message: errors.lessThanMinBet.replace('$1', `${this.state.minBet}`) })
    }
    if (amount > this.state.maxBet) {
      return this.getErrorResult({ message: errors.greaterThanMaxBet.replace('$1', `${this.state.maxBet}`) })
    }
    return null
  }

  /**
   * After an action has been taken successfully by a player (fold, call, bet,
   * or raise), then the turn moves to the next player and the state of the hand
   * is reviewed to determine if the round sould updated (e.g., flop to turn) or
   * if the hand is complete.
   */
  private concludeAction (): void {
    if (this.state.players.filter(player => player.active).length === 1) {
      // Complete the hand if only 1 player left.
      this.state.round = 'complete'
    }

    const allChanceToBet = this.state.players.every(player => player.chanceToBet || !player.active)
    const allCalled = this.state.players.every(player => !player.active || player.currentBet >= this.getHighestBet() || player.purse === 0)
    this.makeNextPlayerCurrent()

    if (allChanceToBet && allCalled) {
      const rounds: Round[] = ['preflop', 'flop', 'turn', 'river', 'complete']
      const currentRoundIndex = rounds.findIndex(round => round === this.state.round)
      this.state.round = rounds[currentRoundIndex + 1]
      this.gatherBetsIntoPots()
      if (this.state.round === 'complete') {
        const rankedHands = sortHands(...this.state.players.map(player => (
          [...player.cards, ...this.state.communityCards]
        )))
        this.state.players.forEach((player, index) => {
          const rankedHand = rankedHands[index]
          if (rankedHand != null) {
            player.showdown = rankedHand
          }
        })
      }
    }
  }

  /**
   * After each round, gathers current bets into pots (multiple because there will be side pots).
   */
  private gatherBetsIntoPots (): void {
    const roundPots: Pot[] = []
    let allInPlayer = this.getAllInPlayerWithSmallestBet()
    while (allInPlayer != null) {
      const allInPlayerBet = allInPlayer.currentBet
      const pot: Pot = this.state.players.map(player => {
        if (allInPlayer != null) {
          const playerBet = Math.min(player.currentBet, allInPlayerBet)
          const deposit = player.currentBet > 0 ? playerBet : 0
          player.currentBet -= playerBet
          return deposit
        }
        return player.currentBet
      })
      roundPots.push(pot)
      allInPlayer = this.getAllInPlayerWithSmallestBet()
    }

    roundPots.push(this.state.players.map(player => {
      const bet = player.currentBet
      player.currentBet = 0
      return bet
    }))

    if (this.state.pots.length && roundPots.length) {
      const topPot = this.state.pots[this.state.pots.length - 1]
      const bottomPot = roundPots.splice(0, 1)[0]
      topPot.forEach((_, index) => {
        topPot[index] += bottomPot[index]
      })
      this.state.pots = [...this.state.pots, ...roundPots]
    } else if (this.state.pots.length === 0 && roundPots.length) {
      this.state.pots = roundPots
    } else if (this.state.pots.length === 0) {
      this.state.pots = [this.state.players.map(player => player.currentBet)]
    }
  }

  private getAllInPlayerWithSmallestBet(): Player | null {
    const allIn = this.state.players.filter(player => player.active && player.currentBet > 0 && player.purse === 0)
    let player: Player | null = allIn.length ? allIn[0] : null
    if (allIn.length > 1) {
      for (let i = 1; i < allIn.length; i++) {
        if (player != null && allIn[i].currentBet < player.currentBet) {
          player = allIn[i]
        }
      }
    }
    return player
  }

  /**
   * Returns the highest bet of the current round.
   */
  private getHighestBet (): number {
    return Math.max(...this.state.players.map(player => player.currentBet))
  }

  /**
   * If hand is still being played, pass the turn to the next player who is still active.
   */
  private makeNextPlayerCurrent (): void {
    if (this.state.round !== 'complete') {
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

  private definePlayers (deck: Deck, options?: HoldEmConstructor): Player[] {
    const players: Player[] = (options?.players != null ? options.players.slice(0, 22) : []).map(
      item => this.createPlayer(deck, item)
    )
    while (players.length < 2) {
      players.push(this.createPlayer(deck))
    }
    return players
  }

  private createPlayer (deck: Deck, optionPlayer?: Partial<Player>): Player {
    return {
      cards: [optionPlayer?.cards?.[0] ?? takeCard(deck), optionPlayer?.cards?.[1] ?? takeCard(deck)],
      purse: optionPlayer?.purse ?? DEFAULT_PLAYER_PURSE,
      currentBet: optionPlayer?.currentBet ?? 0,
      active: optionPlayer?.active ?? true,
      chanceToBet: optionPlayer?.chanceToBet ?? false,
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

  private defineBetLimits (limit: State['limit'], smallBlind: number, largeBlind: number, options?: HoldEmConstructor): [number, number] {
    let minBet = 0
    let maxBet = Number.MAX_VALUE
    if (options?.minBet != null) {
      minBet = Math.max(0, options.minBet)
    } else if (limit === 'pot') {
      minBet = largeBlind
    } else if (limit === 'fixed' || limit === 'none') {
      minBet = largeBlind * 2
    }
    if (options?.maxBet != null) {
      maxBet = Math.max(0, options.maxBet)
    } else if (limit === 'pot') {
      maxBet = smallBlind + largeBlind
    } else if (limit === 'fixed') {
      maxBet = largeBlind * 2
    }
    maxBet = Math.max(maxBet, minBet)
    return [minBet, maxBet]
  }

  private definePots (players: Player[], optionsPots?: Array<Partial<Pot>>): Pot[] {
    return optionsPots?.map(optionPot => {
      return players.map((_, index) => optionPot[index] ?? 0)
    }) ?? []
  }

  private drawCommunityCards (deck: Deck, optionsCommunityCards?: Deck): State['communityCards'] {
    const communityCards: Deck = []
    takeCard(deck) // burn
    communityCards.push(optionsCommunityCards?.[0] ?? takeCard(deck)) // flop 1
    communityCards.push(optionsCommunityCards?.[1] ?? takeCard(deck)) // flop 2
    communityCards.push(optionsCommunityCards?.[2] ?? takeCard(deck)) // flop 3
    takeCard(deck) // burn
    communityCards.push(optionsCommunityCards?.[3] ?? takeCard(deck)) // turn
    takeCard(deck) // burn
    communityCards.push(optionsCommunityCards?.[4] ?? takeCard(deck)) // river
    return communityCards as State['communityCards']
  }

  private removePreselectedCards (deck: Deck, options?: HoldEmConstructor): void {
    options?.communityCards?.forEach(card => {
      this.removeCardFromDeck(deck, card)
    })
    options?.players?.forEach(player => {
      player.cards?.forEach(card => {
        this.removeCardFromDeck(deck, card)
      })
    })
  }

  private removeCardFromDeck (deck: Deck, card: CardKey): void {
    const index = deck.findIndex(deckCard => deckCard === card)
    if (index !== -1) {
      deck.splice(index, 1)
    }
  }

  private checkInitialSetup (): void {
    if (this.state.players[this.state.currentPlayer] == null) {
      throw new Error(`The current player" index ${this.state.currentPlayer} does not exist.`)
    }
    if (!this.state.players[this.state.currentPlayer].active) {
      throw new Error('The current player is no longer active.')
    }
    if (this.state.players.some(player => player.currentBet < 0)) {
      throw new Error('A bet cannot be less than zero.')
    }
  }
}

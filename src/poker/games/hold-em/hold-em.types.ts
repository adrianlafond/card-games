import { CardKey, Deck } from '../../../cards'

export interface BasePlayer {
/**
 * Amount of money available to bet. This is money *not* already in a pot.
 */
  purse: number

  /**
   * Whether the player is still playing in this hand (has not folded).
   */
  active: boolean

  /**
   * The player's current bet, as opposed to the current bet of the hand. For
   * example, if the small blind is 5 and the large blind is 10 then the first
   * player's currentBet is 5 and the global currentBet is 10. So the first
   * player must either fold or call with 5 to bring their currentBet up to 10.
   */
  currentBet: number
}

export interface Player extends BasePlayer {
  /**
   * The cards dealt to this player.
   */
  cards: [CardKey, CardKey]
}

/**
 * Format with player action action input.
 */
export interface PlayerAction {
  action: 'check' | 'bet' | 'call' | 'raise' | 'fold'
  amount?: number
}

export interface Event {
  success?: PlayerAction & { player: number }
  error?: PlayerAction & {
    player: number
    message: string
  }
}

export interface Pot {
  /**
   * Array of indexes of players still eligible to win this pot.
   */
  players: number[]

  /**
   * Value of this pot.
   */
  amount: number
}

/**
 * Base state extended by ActionState and State.
 */
export interface BaseState {
  currentPlayer: number
  currentBet: number
  pots: Pot[]
  round: 'preflop' | 'flop' | 'turn' | 'river' | 'complete'
  minBet: number
  maxBet: number
}

export interface ActionError {
  message: string
}

/**
 * The state of the game shared with players.
 */
export interface ActionState extends BaseState {
  communityCards: [CardKey?, CardKey?, CardKey?, CardKey?, CardKey?]
  players: BasePlayer[]
  raiseAllowed: boolean
  error?: ActionError
}

/**
 * The internal game state, hidden from players.
 */
export interface State extends BaseState {
  deck: Deck
  communityCards: [CardKey, CardKey, CardKey, CardKey, CardKey]

  /**
   * Maximum number of raises per betting round. The default is 3.
   */
  maxRaisesPerRound: number

  /**
 * The small blind. If not defined, it will be either half the large blind or
 * else 1.
 */
  smallBlind: number

  /**
   * The large blind. If not defined, it will be either double the small blind
   * or else 2.
   */
  largeBlind: number
  limit: 'none' | 'fixed' | 'pot'
  raisesMade: number
  isPreflopFirstPass: boolean
  players: Player[]
}

/**
 * Options passed to the HoldEm constructor when initializing a hand.
 */
export interface HoldEmConstructor extends Omit<Partial<State>, 'deck' | 'players'> {
  /**
   * The players, who will be referenced by index. If no purse is defined, the
   * default is 100. At least 2 players will be generated if less than 2 are defined.
   */
  players?: Partial<Player>[]

  /**
   * The type of betting limit for this hand. Default is "none".
   */
  limit?: 'none' | 'fixed' | 'pot'
}

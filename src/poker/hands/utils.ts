import { CardKey, Suit } from '../../cards'
import { suits, values } from './constants'

export function sortSingleCards (a: CardKey, b: CardKey): number {
  const delta = getValueIndex(a) - getValueIndex(b)
  return delta === 0 ? getSuitIndex(a) - getSuitIndex(b) : delta
}

export function sortSingleCardsByReverseSuit (a: CardKey, b: CardKey): number {
  const delta = getValueIndex(a) - getValueIndex(b)
  return delta === 0 ? getSuitIndex(b) - getSuitIndex(a) : delta
}

export function getValue (card: CardKey): string {
  return card.charAt(0)
}

export function getValueIndex (card: CardKey): number {
  return values.indexOf(getValue(card))
}

export function getSuit (card: CardKey): Suit {
  return card.charAt(1) as Suit
}

export function getSuitIndex (card: CardKey): number {
  return suits.indexOf(getSuit(card))
}

import { CardKey, Deck } from './types'

/**
 * Returns the top (first) card from the deck.
 */
export function takeCard (deck: Deck): CardKey {
  const card = deck.shift()
  if (card == null) {
    throw new Error('The deck of cards is empty. No more cards can be taken.')
  }
  return card
}

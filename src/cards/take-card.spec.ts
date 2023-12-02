import { shuffle } from './shuffle'
import { takeCard } from './take-card'
import { Deck } from './types'

describe('takeCard', () => {
  it('removes and returns a CardKey from the deck', () => {
    const deck = shuffle()
    const topCard = deck[0]
    expect(deck.length).toBe(52)
    expect(takeCard(deck)).toBe(topCard)
    expect(deck.length).toBe(51)
  })
  it('returns the last card of a one-card deck', () => {
    const deck: Deck = ['AS']
    expect(deck.length).toBe(1)
    expect(takeCard(deck)).toBe('AS')
    expect(deck.length).toBe(0)
  })
  it('throws an error if the deck is empty', () => {
    expect(() => takeCard([])).toThrow()
  })
})

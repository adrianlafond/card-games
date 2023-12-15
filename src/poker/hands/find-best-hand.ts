import { CardKey, Deck } from '../../cards'
import { Hand } from './constants'
import { getSuit, getSuitIndex, getValue, getValueIndex, sortSingleCards, sortSingleCardsByReverseSuit } from './utils'

export function findBestHand (playerCards: Deck): [Deck, Hand] {
  const sortedCards = [...playerCards]
  sortedCards.sort(sortSingleCards)

  const straights = getStraights(sortedCards)
  for (let i = 0; i < straights.length; i++) {
    if (isFlush(straights[i])) {
      return [straights[i], getValue(straights[i][0]) === 'A' ? 'royal-flush' : 'straight-flush']
    }
  }

  const kinds = getOfAKinds(sortedCards)

  const fourOfAKind = getOfAKind(kinds, sortedCards, 4)
  if (fourOfAKind != null) {
    return [fourOfAKind, 'four-of-a-kind']
  }

  const fullHouse = getFullHouse(kinds)
  if (fullHouse != null) {
    return [fullHouse, 'full-house']
  }

  const flush = getFlush(sortedCards)
  if (flush != null) {
    return [flush, 'flush']
  }

  if (straights.length > 0) {
    return [straights[0], 'straight']
  }

  const threeOfAKind = getOfAKind(kinds, sortedCards, 3)
  if (threeOfAKind != null) {
    return [threeOfAKind, 'three-of-a-kind']
  }

  const twoPair = getTwoPair(kinds, sortedCards)
  if (twoPair != null) {
    return [twoPair, 'two-pair']
  }

  const pair = getOfAKind(kinds, sortedCards, 2)
  if (pair != null) {
    return [pair, 'pair']
  }

  return [sortedCards.slice(0, 5), 'high-card']
}

/**
 * Checks if a hand of five cards is a flush or not.
 */
function isFlush (cards: Deck): boolean {
  const suit = getSuit(cards[0])
  for (let i = 1; i < 5; i++) {
    if (getSuit(cards[i]) !== suit) {
      return false
    }
  }
  return true
}

/**
 * Finds the best flesh from a collection of cards.
 */
function getFlush (sortedCards: Deck): Deck | null {
  const suits: CardKey[][] = [[], [], [], []]
  sortedCards.forEach(card => {
    const index = getSuitIndex(card)
    suits[index].push(card)
  })
  let bestHand: Deck | null = null
  suits.filter(collection => collection.length >= 5).forEach(collection => {
    if (bestHand == null) {
      bestHand = collection.slice(0, 5)
    } else {
      for (let i = 0; i < 5; i++) {
        const a = getValueIndex(bestHand[i])
        const b = getValueIndex(collection[i])
        if (a < b) {
          return;
        } else if (b < a) {
          bestHand = collection.slice(0, 5)
        }
      }
    }
  })
  return bestHand
}

/**
 * Returns all straights in a collection of cards.
 */
function getStraights (sortedCards: Deck): Deck[] {
  const reverseSuited = [...sortedCards]
  reverseSuited.sort(sortSingleCardsByReverseSuit)
  const cards = cloneAcesToBottom(reverseSuited)
  const straights: Deck[] = []

  const nextCard = (index: number = 0, straight: Deck = []): void => {
    const a = cards[index]
    const newStraight = [...straight, a]

    if (newStraight.length === 5) {
      straights.push(newStraight)
    } else {
      let n = index + 1
      while (n < cards.length) {
        const b = cards[n]
        const delta = getValueIndex(a) - getValueIndex(b)

        if (delta === -1 || delta === 12) {
          nextCard(n, newStraight)
          nextCard(n, [])
        } else if (delta === 0) {
          nextCard(n, straight)
        } else {
          nextCard(n, [])
          break
        }
        n += 1
      }
    }
  }

  nextCard()
  return straights
}

/**
 * Duplicates aces and pushes them onto the bottom of a *sorted* hand of cards
 * because aces can be both high and low.
 */
function cloneAcesToBottom (sortedCards: Deck): Deck {
  const cardsLen = sortedCards.length
  const cards = [...sortedCards]
  for (let i = 0; i < cardsLen; i++) {
    if (getValue(cards[i]) === 'A') {
      cards.push(cards[i])
    } else {
      break
    }
  }
  return cards
}

function getOfAKinds(sortedCards: Deck): Deck[] {
  const kinds: Deck[] = []
  let tempKind: Deck = []
  sortedCards.forEach(card => {
    if (tempKind.length === 0) {
      tempKind.push(card)
    } else if (getValue(card) === getValue(tempKind[0])) {
      tempKind.push(card)
    } else {
      if (tempKind.length) {
        kinds.push(tempKind)
      }
      tempKind = [card]
    }
  })
  if (tempKind.length) {
    kinds.push(tempKind)
  }
  kinds.sort((a, b) => {
    const delta = b.length - a.length
    if (delta !== 0) {
      return delta
    }
    return getValueIndex(a[0]) - getValueIndex(b[0])
  })
  return kinds
}

function getOfAKind(kinds: Deck[], sortedCards: Deck, kindNumber: number): Deck | null {
  if (kinds[0].length === kindNumber) {
    const otherCards = sortedCards.filter(card => getValue(card) !== getValue(kinds[0][0]))
    return [...kinds[0], ...otherCards].slice(0, 5)
  }
  return null
}

function getFullHouse(kinds: Deck[]): Deck | null {
  if (kinds[0].length === 3) {
    let bottom: Deck | null = null
    for (let i = 1; i < kinds.length; i++) {
      if (kinds[i].length >= 2) {
        if (bottom == null || getValueIndex(kinds[i][0]) < getValueIndex(bottom[0])) {
          bottom = kinds[i]
        }
      }
    }
    if (bottom != null) {
      return [...kinds[0], ...bottom.slice(0, 2)]
    }
  }
  return null
}

function getTwoPair(kinds: Deck[], sortedCards: Deck): Deck | null {
  if (kinds[0].length === 2 && kinds[1].length === 2) {
    const otherCards = sortedCards.filter(card => getValue(card) != getValue(kinds[0][0]) && getValue(card) != getValue(kinds[1][0]))
    return [...kinds[0], ...kinds[1], otherCards[0]]
  }
  return null
}

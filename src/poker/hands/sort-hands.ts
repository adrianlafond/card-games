import { CardKey, Deck, Suit } from '../../cards';
import { values, Hand, handKeys, suits } from './constants';

export interface RankedHand {
  rank: number
  cards: Deck
  hand: Hand
}

export function sortHands(...playersCards: Deck[]): RankedHand[] {
  const hands: RankedHand[] = playersCards.map(playerCards => {
    const [cards, hand] = findBestHand(playerCards)
    return { cards, hand, rank: playersCards.length - 1 }
  })

  rankHighCards(hands)
  return hands
}

export function findBestHand(playerCards: Deck): [Deck, Hand] {
  const sortedCards = [...playerCards]
  sortedCards.sort(sortSingleCards)

  const straights = getStraights(sortedCards)
  for (let i = 0; i < straights.length; i++) {
    if (isFlush(straights[i])) {
      return [straights[i], getValue(straights[i][0]) === 'A' ? 'royal-flush' : 'straight-flush']
    }
  }

  if (straights.length) {
    return [straights[0], 'straight']
  }
  const [isStraightFlush, cardsStraighFlush] = checkForStraightFlush(sortedCards)
  if (isStraightFlush) {
    return [cardsStraighFlush, 'straight-flush']
  }
  const [isPair, cardsPair] = checkForPair(sortedCards)
  if (isPair) {
    return [cardsPair, 'pair']
  }
  return [sortedCards.slice(0, 5), 'high-card']
}

function sortSingleCards(a: CardKey, b: CardKey): number {
  const delta = getValueIndex(a) - getValueIndex(b)
  return delta === 0 ? getSuitIndex(a) - getSuitIndex(b) : delta
}

function sortSingleCardsByReverseSuit(a: CardKey, b: CardKey): number {
  const delta = getValueIndex(a) - getValueIndex(b)
  return delta === 0 ? getSuitIndex(b) - getSuitIndex(a) : delta
}

function getValue(card: CardKey): string {
  return card.charAt(0)
}

function getValueIndex(card: CardKey): number {
  return values.indexOf(getValue(card))
}

function getSuit(card: CardKey): Suit {
  return card.charAt(1) as Suit
}

function getSuitIndex(card: CardKey): number {
  return suits.indexOf(getSuit(card))
}

function isFlush(cards: Deck): boolean {
  let suit = getSuit(cards[0])
  for (let i = 1; i < 5; i++) {
    if (getSuit(cards[i]) !== suit) {
      return false
    }
  }
  return true
}

function getStraights(sortedCards: Deck): Deck[] {
  const reverseSuited = [...sortedCards]
  reverseSuited.sort(sortSingleCardsByReverseSuit)
  const cards = cloneAcesToBottom(reverseSuited)
  const straights: Deck[] = []

  const nextCard = (index: number = 0, straight: Deck = []) => {
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
function cloneAcesToBottom(sortedCards: Deck): Deck {
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

function reverseBySuit(sortedCards: Deck): Deck {
  sortedCards.sort((a, b) => {
    return getSuitIndex(b) - getSuitIndex(a)
  })
  return sortedCards
}

function checkForStraightFlush(cards: Deck): [boolean, Deck] {
  let straightFlushCards: Deck = []
  let tmpIndex: number = 0
  let tmpSuit: Suit = 'C'
  for (let i = 0; i < cards.length; i++) {
    const index = getValueIndex(cards[i])
    const suit = getSuit(cards[i])
    if (straightFlushCards.length === 0) {
      straightFlushCards.push(cards[i])
      tmpIndex = index
      tmpSuit = suit
    } else {
      if (index - tmpIndex === 1 && suit === tmpSuit) {
        straightFlushCards.push(cards[i])
      } else if (index - tmpIndex > 1) {
        straightFlushCards = []
      }
    }
    if (straightFlushCards.length === 5) {
      return [true, straightFlushCards];
    }
  }
  return [false, cards]
}

function checkForFour(cards: Deck): [boolean, Deck] {
  return [false, cards]
}

function checkForFullHouse(cards: Deck): [boolean, Deck] {
  return [false, cards]
}

function checkForStraight(cards: Deck): [boolean, Deck] {
  return [false, cards]
}

function checkForThree(cards: Deck): [boolean, Deck] {
  return [false, cards]
}

function checkForTwoPair(cards: Deck): [boolean, Deck] {
  return [false, cards]
}

function checkForPair(cards: Deck): [boolean, Deck] {
  for (let i = 0; i < cards.length - 1; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (getValue(cards[i]) === getValue(cards[j])) {
        const a = cards.splice(j, 1)[0]
        const b = cards.splice(i, 1)[0]
        cards.unshift(b, a)
        return [true, cards.slice(0, 5)]
      }
    }
  }
  return [false, cards]
}

function checkForValueMatches(cards: Deck): [boolean, Deck] {
  //
  return [false, cards]
}

function rankHighCards(hands: RankedHand[]): RankedHand[] {
  for (let i = 0; i < hands.length - 1; i++) {
    for (let j = i + 1; j < hands.length; j++) {
      const hand1 = hands[i]
      const hand2 = hands[j]
      for (let k = 0; k < Math.min(hand1.cards.length, hand2.cards.length); k++) {
        const delta = getValueIndex(hand1.cards[k]) - getValueIndex(hand2.cards[k])
        if (delta < 0) {
          hand1.rank -= 1
          break
        } else if (delta > 0) {
          hand2.rank -= 1
          break
        }
      }
    }
  }
  return hands
}

import { CardKey, Deck, Suit } from '../../cards'
import { values, Hand, handKeys, suits } from './constants'
import { findBestHand } from './find-best-hand'
import { getValue, getValueIndex } from './utils'

export interface RankedHand {
  rank: number
  cards: Deck
  hand: Hand
}

export function sortHands (...playersCards: Deck[]): RankedHand[] {
  const hands: RankedHand[] = playersCards.map(playerCards => {
    const [cards, hand] = findBestHand(playerCards)
    return { cards, hand, rank: playersCards.length - 1 }
  })

  rankHighCards(hands)
  return hands
}

function checkForFour (cards: Deck): [boolean, Deck] {
  return [false, cards]
}

function checkForFullHouse (cards: Deck): [boolean, Deck] {
  return [false, cards]
}

function checkForStraight (cards: Deck): [boolean, Deck] {
  return [false, cards]
}

function checkForThree (cards: Deck): [boolean, Deck] {
  return [false, cards]
}

function checkForTwoPair (cards: Deck): [boolean, Deck] {
  return [false, cards]
}

function checkForPair (cards: Deck): [boolean, Deck] {
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

function checkForValueMatches (cards: Deck): [boolean, Deck] {
  //
  return [false, cards]
}

function rankHighCards (hands: RankedHand[]): RankedHand[] {
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

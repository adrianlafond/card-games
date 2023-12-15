import { Deck } from '../../cards'
import { Hand, handKeys } from './constants'
import { findBestHand } from './find-best-hand'
import { getValueIndex } from './utils'

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

  rankHands(hands)
  return hands
}

function rankHands(hands: RankedHand[]): RankedHand[] {
  for (let i = 0; i < hands.length - 1; i++) {
    for (let j = i + 1; j < hands.length; j++) {
      const hand1 = hands[i]
      const hand2 = hands[j]
      const handDelta = handKeys.indexOf(hand1.hand) - handKeys.indexOf(hand2.hand)
      if (handDelta < 0) {
        hand1.rank -= 1
      } else if (handDelta > 0) {
        hand1.rank -= 1
      } else if (hand1.hand !== 'royal-flush') {
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
  }
  for (let i = 0; i < hands.length; i++) {
    if (!hands.some(hand => hand.rank === i)) {
      hands.forEach(hand => {
        if (hand.rank === i + 1) {
          hand.rank -= 1
        }
      })
    }
  }
  return hands
}

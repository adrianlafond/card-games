import { Deck } from './types'
import { keys } from './keys'

export function shuffle (): Deck {
  const shuffled: Deck = []
  const copy = keys.slice()
  while (copy.length > 0) {
    const index = Math.floor(Math.random() * copy.length)
    shuffled.push(copy[index])
    copy.splice(index, 1)
  }
  return shuffled
}

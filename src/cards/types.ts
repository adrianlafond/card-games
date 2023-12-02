import { keys } from './keys'

export type CardKey = (typeof keys)[number]
export type Deck = CardKey[]

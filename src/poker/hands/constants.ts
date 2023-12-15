export const values = ['A', 'K', 'Q', 'J', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
export const suits = ['C', 'D', 'H', 'S']

export const handKeys = [
  'royal-flush',
  'straight-flush',
  'four-of-a-kind',
  'full-house',
  'flush',
  'straight',
  'three-of-a-kind',
  'two-pair',
  'pair',
  'high-card'
  // ...values.map(value => `straight-flush--${value}`).splice(1, 10),
  // ...values.map(value => `four-of-a-kind--${value}`),
  // ...values.reduce((array, value) => {
  //   for (let i = 0; i < values.length; i++) {
  //     if (value !== values[i]) {
  //       array.push(`full-house--${value}-${values[i]}`)
  //     }
  //   }
  //   return array
  // }, [] as string[]),
  // ...values.map(value => `flush--${value}`).splice(0, 8),
  // ...values.map(value => `straight--${value}`).splice(0, 10),
  // three-of-a-kind
  // two-pair
  // pair
  // high-card
] as const

export type Hand = (typeof handKeys)[number]

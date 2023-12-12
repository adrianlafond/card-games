import { findBestHand, sortHands } from './sort-hands'

describe('findBestHand()', () => {
  it('finds the best straight', () => {
    expect(findBestHand(
      ['8C', '9C', '6S', '7D', 'AH', 'XH', '5D'],
    )).toEqual([['XH', '9C', '8C', '7D', '6S'], 'straight'])
  })
  it('finds a straight with an ace at bottom', () => {
    expect(findBestHand(
      ['2C', '3C', 'XS', '7D', 'AH', '4H', '5D'],
    )).toEqual([['5D', '4H', '3C', '2C', 'AH'], 'straight'])
  })
  it('sorts by suit when hand contains multiple straights of same value', () => {
    expect(findBestHand(
      ['AH', '7C', 'XD', 'XC', '9D', '8H', '6S'],
    )).toEqual([['XC', '9D', '8H', '7C', '6S'], 'straight'])
  })
  it('finds a royal flush', () => {
    expect(findBestHand(
      ['JH', 'XH', 'AD', 'AH', 'KH', 'QH', 'JC'],
    )).toEqual([['AH', 'KH', 'QH', 'JH', 'XH'], 'royal-flush'])
  })
  it.only('finds a straight flush', () => {
    expect(findBestHand(
      ['JH', 'XH', 'AD', '9H', 'KH', 'QH', 'JC'],
    )).toEqual([['KH', 'QH', 'JH', 'XH', '9H'], 'straight-flush'])
  })
})

describe.skip('sortHands()', () => {
  it('ranks high cards with a single card', () => {
    expect(sortHands(['7C'], ['KD'], ['JH'])).toEqual([
      { rank: 2, cards: ['7C'], hand: 'high-card' },
      { rank: 0, cards: ['KD'], hand: 'high-card' },
      { rank: 1, cards: ['JH'], hand: 'high-card' },
    ])
  })
  it('ranks high cards with 2 cards', () => {
    expect(sortHands(['2S', '7C'], ['3C', 'KD'], ['JH', '6D'])).toEqual([
      { rank: 2, cards: ['7C', '2S'], hand: 'high-card' },
      { rank: 0, cards: ['KD', '3C'], hand: 'high-card' },
      { rank: 1, cards: ['JH', '6D'], hand: 'high-card' },
    ])
  })
  it('ranks a pair above high cards', () => {
    expect(sortHands(
      ['2C', 'KC', 'AC', '2D', 'JC', 'XD', '9D'],
      ['3H', 'KS', '7H', 'JS', '8H', 'QS', 'AH'],
      ['JH', '6D', '4D', '5D', 'XH', 'QH', '2H'],
    )).toEqual([
      { rank: 0, cards: ['2C', '2D', 'AC', 'KC', 'JC', 'XD', '9D'], hand: 'pair' },
      { rank: 1, cards: ['AH', 'KS', 'QS', 'JS', '8H', '7H', '3H'], hand: 'high-card' },
      { rank: 2, cards: ['QH', 'JH', 'XH', '5D', '6D', '4D', '2H'], hand: 'high-card' },
    ])
  })
})

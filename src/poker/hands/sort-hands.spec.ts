import { sortHands } from './sort-hands'

describe('sortHands()', () => {
  it('ranks high cards with a single card', () => {
    expect(sortHands(['7C'], ['KD'], ['JH'])).toEqual([
      { rank: 2, cards: ['7C'], hand: 'high-card' },
      { rank: 0, cards: ['KD'], hand: 'high-card' },
      { rank: 1, cards: ['JH'], hand: 'high-card' }
    ])
  })
  it('ranks high cards with 2 cards', () => {
    expect(sortHands(['2S', '7C'], ['3C', 'KD'], ['JH', '6D'])).toEqual([
      { rank: 2, cards: ['7C', '2S'], hand: 'high-card' },
      { rank: 0, cards: ['KD', '3C'], hand: 'high-card' },
      { rank: 1, cards: ['JH', '6D'], hand: 'high-card' }
    ])
  })
  it('ranks a pair above high cards', () => {
    expect(sortHands(
      ['2C', 'KC', 'AC', '2D', 'JC', 'XD', '9D'],
      ['3H', 'KS', '7H', 'JS', '8H', 'QS', 'AH'],
      ['JH', '6D', '4D', '5D', 'XH', 'QH', '2H']
    )).toEqual([
      { rank: 0, cards: ['2C', '2D', 'AC', 'KC', 'JC'], hand: 'pair' },
      { rank: 1, cards: ['AH', 'KS', 'QS', 'JS', '8H'], hand: 'high-card' },
      { rank: 2, cards: ['QH', 'JH', 'XH', '6D', '5D'], hand: 'high-card' }
    ])
  })
  it('ranks matching hands by highest card', () => {
    expect(sortHands(
      ['8C', '7D', '9S', 'XD', 'JH'],
      ['8D', 'QC', '9D', 'XC', 'JD'],
    )).toEqual([
      { rank: 1, cards: ['JH', 'XD', '9S', '8C', '7D'], hand: 'straight' },
      { rank: 0, cards: ['QC', 'JD', 'XC', '9D', '8D'], hand: 'straight' },
    ])
  })
  it('ranks matching hands with same highest card as even', () => {
    expect(sortHands(
      ['8C', '7D', '9S', 'XD', 'JH'],
      ['8D', '7C', '9D', 'XC', 'JD'],
      ['3C', '4D', 'AS', 'KH', '2D'],
    )).toEqual([
      { rank: 0, cards: ['JH', 'XD', '9S', '8C', '7D'], hand: 'straight' },
      { rank: 0, cards: ['JD', 'XC', '9D', '8D', '7C'], hand: 'straight' },
      { rank: 1, cards: ['AS', 'KH', '4D', '3C', '2D'], hand: 'high-card' },
    ])
  })
})

import { findBestHand } from './find-best-hand'

describe('findBestHand()', () => {
  it('finds the best straight', () => {
    expect(findBestHand(
      ['8C', '9C', '6S', '7D', 'AH', 'XH', '5D']
    )).toEqual([['XH', '9C', '8C', '7D', '6S'], 'straight'])
  })
  it('finds a straight with an ace at bottom', () => {
    expect(findBestHand(
      ['2C', '3C', 'XS', '7D', 'AH', '4H', '5D']
    )).toEqual([['5D', '4H', '3C', '2C', 'AH'], 'straight'])
  })
  it('sorts by suit when hand contains multiple straights of same value', () => {
    expect(findBestHand(
      ['AH', '7C', 'XD', 'XC', '9D', '8H', '6S']
    )).toEqual([['XC', '9D', '8H', '7C', '6S'], 'straight'])
  })
  it('ignores a non-flush straight and finds a royal flush', () => {
    expect(findBestHand(
      ['JH', 'XH', 'AD', 'AH', 'KH', 'QH', 'JC']
    )).toEqual([['AH', 'KH', 'QH', 'JH', 'XH'], 'royal-flush'])
  })
  it('ignores a non-flush straight and finds a straight flush', () => {
    expect(findBestHand(
      ['JH', 'XH', 'AD', '9H', 'KH', 'QH', 'JC']
    )).toEqual([['KH', 'QH', 'JH', 'XH', '9H'], 'straight-flush'])
  })
  it('finds the highest flush', () => {
    expect(findBestHand(
      ['2S', '4S', 'KS', '8S', '9S', '8H', 'AS']
    )).toEqual([['AS', 'KS', '9S', '8S', '4S'], 'flush'])
  })
  it('finds the highest flush from multiple flushes', () => {
    expect(findBestHand(
      ['7H', 'QH', 'AH', '4H', '2S', '4S', 'KS', '8S', '9S', '8H', 'AS']
    )).toEqual([['AS', 'KS', '9S', '8S', '4S'], 'flush'])
  })
  it('ignores a flush and finds four of a kind', () => {
    expect(findBestHand(
      ['XS', 'XH', '9S', 'XC', '3S', 'XD', '2S', 'KS']
    )).toEqual([['XC', 'XD', 'XH', 'XS', 'KS'], 'four-of-a-kind'])
  })
  it('ignores a full house and finds four of a kind', () => {
    expect(findBestHand(
      ['XS', 'XH', '9S', 'XC', 'KC', 'XD', 'KH', 'KS']
    )).toEqual([['XC', 'XD', 'XH', 'XS', 'KC'], 'four-of-a-kind'])
  })
  it('ignores a flush and finds a full house', () => {
    expect(findBestHand(
      ['XS', 'XH', '9S', 'XC', '3S', '5S', '2S', 'KS', '3C']
    )).toEqual([['XC', 'XH', 'XS', '3C', '3S'], 'full-house'])
  })
  it('ignores high card and returns three of a kind', () => {
    expect(findBestHand(
      ['AC', '3C', '7H', '3D', '5D', '3H', '2C']
    )).toEqual([['3C', '3D', '3H', 'AC', '7H'], 'three-of-a-kind'])
  })
  it('ignores high card and return two pair', () => {
    expect(findBestHand(
      ['3H', '9S', '3D', 'AS', '2S', '2C', '7H']
    )).toEqual([['3D', '3H', '2C', '2S', 'AS'], 'two-pair'])
  })
  it('ignores high card and returns pair', () => {
    expect(findBestHand(
      ['3H', 'AH', '3D', '9C', '7D', '5C', 'JH']
    )).toEqual([['3D', '3H', 'AH', 'JH', '9C'], 'pair'])
  })
  it('finds the high card', () => {
    expect(findBestHand(
      ['7S', '6D', '3H', '4C', 'AD', 'XC', '2S']
    )).toEqual([['AD', 'XC', '7S', '6D', '4C'], 'high-card'])
  })
})

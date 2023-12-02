import { HoldEm } from './hold-em'

describe('Hold\'em poker', () => {
  it('creates a new hand', () => {
    const state = new HoldEm().getState()
    expect(state).toBeDefined()
  })
})

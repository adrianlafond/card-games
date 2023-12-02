import { keys } from './keys'
import { shuffle } from './shuffle';

describe('shuffle', () => {
  it('first confirms that toEqual works as expected', () => {
    expect(keys.slice()).toEqual(keys)
  })
  it('returns an array card keys that in a different order than the default', () => {
    expect(shuffle()).not.toEqual(keys)
  })
});

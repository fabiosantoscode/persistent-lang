import { builtins } from './builtins.js'

const add = builtins['+']
const mul = builtins['*']
const gt = builtins['>']

it('can add numbers or strings', () => {
  expect(() => add()).toThrow(/at least 1 argument/i)
  expect(add(1)).toEqual(1)
  expect(add(1, 2)).toEqual(3)
  expect(add(1, 2, 3)).toEqual(6)

  expect(add('a', 'b')).toEqual('ab')
  expect(add('a', 1)).toEqual('a1')

  expect(() => add({})).toThrow(/mismatched types/i)
})

it('can compare a sequence', () => {
  expect(gt(3, 2)).toEqual(true)
  expect(gt(2, 3)).toEqual(false)
  expect(gt(3, 1, 2)).toEqual(false)
  expect(gt(3, 2, 1)).toEqual(true)

  expect(gt('b', 'a')).toEqual(true)

  expect(() => gt('b', 1)).toThrow(/mismatched types/i)
  expect(() => gt()).toThrow(/at least 2 arguments/i)
  expect(() => gt(3)).toThrow(/at least 2 arguments/i)
  expect(() => gt(1, 2, {})).toThrow(/mismatched types/i)
})

it('can multiply', () => {
  expect(mul(3, 2)).toEqual(6)
  expect(mul(3, 2, 4)).toEqual(24)
  expect(mul(3)).toEqual(3)

  expect(() => mul()).toThrow()
  expect(() => mul('a', 'b')).toThrow(/mismatched types/i)
})

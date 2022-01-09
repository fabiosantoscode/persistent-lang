import { checkSerializable } from './utils.js'

it('checks primitives are serializable', () => {
  expect(checkSerializable(1)).toEqual(true)
  expect(checkSerializable(false)).toEqual(true)
  expect(checkSerializable('')).toEqual(true)
  expect(checkSerializable(null)).toEqual(true)

  expect(checkSerializable(undefined)).toEqual(false)
  expect(checkSerializable(NaN)).toEqual(false)
  expect(checkSerializable(Infinity)).toEqual(false)
})

it('checks arrays', () => {
  expect(checkSerializable([])).toEqual(true)
  expect(checkSerializable([1])).toEqual(true)
  expect(checkSerializable([NaN])).toEqual(false)
})

it('checks objects', () => {
  expect(checkSerializable({})).toEqual(true)
  expect(checkSerializable({ a: 1 })).toEqual(true)
  expect(checkSerializable({ a: NaN })).toEqual(false)

  expect(checkSerializable({ a: { b: 1 } })).toEqual(true)
  expect(checkSerializable({ a: { b: NaN } })).toEqual(false)
})

it('rejects class instances', () => {
  class SomeClass {}
  expect(checkSerializable(new SomeClass())).toEqual(false)
})

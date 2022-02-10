import { builtins } from './builtins.js'

const gt = builtins['>']
const eq = builtins['==']
const neq = builtins['!=']

it('can compare things', () => {
  expect(gt(3, 2)).toEqual(true)
  expect(gt(2, 2)).toEqual(false)
  expect(gt(2, 3)).toEqual(false)

  expect(eq(1, 1)).toEqual(true)
  expect(eq(1, 2)).toEqual(false)

  expect(neq(1, 2)).toEqual(true)
  expect(neq(1, 1)).toEqual(false)
})

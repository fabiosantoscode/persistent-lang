import assert from 'assert'
import { getInitialState } from './iterate.js'
import { createProgram, evaluate } from './core.js'

// Trampoline the program forward for testing
const advanceAll = (program) => {
  let execLimit = 100

  const yieldedList = []

  const state = getInitialState()
  let yielded
  while (state.running) {
    yielded = evaluate(program, state)
    if (yielded) yieldedList.push(yielded)

    if (execLimit-- <= 0) throw new Error('infinite loop?')
  }

  return state.stack.pop()
}

it('can advance basic programs', () => {
  expect(advanceAll(createProgram(`123 456`))).toEqual(456)
})

describe('functions', () => {
  it('function', () => {
    expect(
      advanceAll(
        createProgram(`
          (fn hello [] "world")
          (hello)
        `)
      )
    ).toEqual('world')
  })

  it('arguments', () => {
    expect(
      advanceAll(
        createProgram(`
          (fn first [a b] a)
          (first 1 2)
        `)
      )
    ).toEqual(1)

    expect(
      advanceAll(
        createProgram(`
          (fn second [a b] b)
          (second 1 2)
        `)
      )
    ).toMatchInlineSnapshot(`2`)
  })

  it('scope', () => {
    expect(
      advanceAll(
        createProgram(`
          (fn b [name] name)
          (fn a [name] (b "name 2"))
          (a "name")
        `)
      )
    ).toEqual('name 2')
  })
})

it('nested calls', () => {
  expect(advanceAll(createProgram(`(+ 1 (+ 2 3))`))).toEqual(6)
})

it('lists', () => {
  expect(advanceAll(createProgram(`[1 2]`))).toEqual([1, 2])
})

it('order of operations', () => {
  expect(advanceAll(createProgram(`[ 1 [ [ 2 3 ] 4 ] ]`)))
    .toMatchInlineSnapshot(`
      Array [
        1,
        Array [
          Array [
            2,
            3,
          ],
          4,
        ],
      ]
    `)
})

import assert from 'assert'
import { getInitialState } from './iterate.js'
import { createProgram, advance } from './core.js'

// CreateProgram but for use with template strings
const quickCreate = ([code]) => createProgram(code)

// Trampoline the program forward for testing
const advanceAll = (program) => {
  let execLimit = 100

  const yieldedList = []

  const state = getInitialState()
  let yielded
  while (state.running) {
    yielded = advance(program, state)
    if (yielded) yieldedList.push(yielded)

    if (execLimit-- <= 0) throw new Error('infinite loop?')
  }

  return state.stack.pop()
}

it('can advance basic programs', () => {
  expect(
    advanceAll(quickCreate`
      123
      456
    `)
  ).toMatchInlineSnapshot(`456`)
})

describe('functions', () => {
  it('function', () => {
    expect(
      advanceAll(quickCreate`
        (fn hello [] "world")
        (hello)
      `)
    ).toEqual('world')
  })

  it('arguments', () => {
    expect(
      advanceAll(
        quickCreate`
          (fn first [a b] a)
          (first 1 2)
        `
      )
    ).toMatchInlineSnapshot(`1`)

    expect(
      advanceAll(
        quickCreate`
          (fn second [a b] b)
          (second 1 2)
        `
      )
    ).toMatchInlineSnapshot(`2`)
  })

  it('scope', () => {
    expect(
      advanceAll(
        quickCreate`
          (fn b [name] name)
          (fn a [name] (b "name 2"))
          (a "name")
        `
      )
    ).toEqual('name 2')
  })
})

it('nested calls', () => {
  expect(
    advanceAll(quickCreate`
    (+ 1 (+ 2 3))
  `)
  ).toMatchInlineSnapshot(`6`)
})

it('lists', () => {
  expect(advanceAll(quickCreate`[1 2]`)).toMatchInlineSnapshot(`
    Array [
      1,
      2,
    ]
  `)
})

it('order of operations', () => {
  expect(
    advanceAll(quickCreate`
      [ 1 [ [ 2 3 ] 4 ] ]
    `)
  ).toMatchInlineSnapshot(`
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

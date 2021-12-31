import assert from 'assert'
import { createProgram, advance } from './core.js'

// CreateProgram but for use with template strings
const quickCreate = ([code]) => createProgram(code)

// Trampoline the program forward for testing
const advanceAll = (program) => {
  let execLimit = 100

  const yieldedList = []

  let yielded, state
  while (true) {
    ;[yielded, state] = advance(program, state)
    if (yielded) yieldedList.push(yielded)
    if (state == null) {
      yieldedList.push(yielded)
      return yieldedList
    }

    if (execLimit-- <= 0) throw new Error('infinite loop?')
  }
}

it('can advance basic programs', () => {
  expect(
    advanceAll(quickCreate`
      123
      456
    `)
  ).toMatchInlineSnapshot(`
    Array [
      123,
      456,
      456,
    ]
  `)
})

describe('functions', () => {
  it('function', () => {
    // TODO this only appears to work because the trampoline logs "world" as it's returned
    expect(
      advanceAll(quickCreate`
        (fn hello [] "world")
        (hello)
      `).pop()
    ).toEqual('world')
  })

  it.skip('arguments', () => {
    expect(
      advanceAll(quickCreate`
        (fn first [a b] a)
        (fn second [a b] b)
        (first 1 2)
        (second 1 2)
      `)
    ).toMatchInlineSnapshot(`
      Array [
        1,
        1,
        2,
        2,
        2,
      ]
    `)
  })
})

it.skip('nested calls', () => {
  expect(
    advanceAll(quickCreate`
    (+ 1 (+ 2 3))
  `)
  ).toMatchInlineSnapshot(`x`)
})

it.skip('arrays', () => {
  expect(
    advanceAll(quickCreate`
      (fn pair [a b] [a b])
      (pair 1 2)
    `)
  ).toMatchInlineSnapshot(`
    Array [
      Array [
        1
        2
      ],
    ]
  `)
})

it('order of operations', () => {
  expect(
    advanceAll(quickCreate`
      1 (do 2 (do (do 3 4) 5) 6)
    `)
  ).toMatchInlineSnapshot(`
    Array [
      1,
      2,
      3,
      4,
      5,
      6,
      6,
    ]
  `)
})

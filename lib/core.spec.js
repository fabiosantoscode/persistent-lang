import assert from 'assert'
import { createProgram, advance } from './core.js'

// Trampoline the program forward and log some stuff
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
    advanceAll(createProgram`
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

it('can function', () => {
  expect(
    advanceAll(createProgram`
      (fn hello [] "world")
      (hello)
    `).pop()
  ).toEqual('world')
})

it('Order of operations', () => {
  expect(
    advanceAll(createProgram`
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

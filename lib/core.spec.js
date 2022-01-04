import { jest } from '@jest/globals'
import {
  createProgram,
  evaluate,
  satisfyYield,
  getInitialState,
  Ticket,
} from './core.js'

const getAllYielded = (code) => {
  const program = createProgram(code)
  const state = getInitialState()

  const yieldedList = []
  let execLimit = 100
  while (state.runStatus) {
    const [status, yielded] = evaluate(program, state)

    if (status === 'yielded') {
      yieldedList.push(yielded)
      satisfyYield(program, state, null)
    }

    if (execLimit-- <= 0) {
      throw new Error('infinite loop?')
    }
  }

  return yieldedList
}

// Trampoline the program forward for testing
const advanceAll = (code, library) => {
  const program = createProgram(code, library)
  const state = getInitialState()

  const [status, returned] = evaluate(program, state)

  expect(status).toEqual('finished')
  expect(state.runStatus).toEqual(null)
  expect(state.stack.length).toEqual(0)

  return returned
}

it('can advance basic programs', () => {
  expect(advanceAll(`123 456`)).toEqual(456)
})

describe('functions', () => {
  it('function', () => {
    expect(advanceAll(`(fn hello [] "world") (hello)`)).toEqual('world')
  })

  it('arguments', () => {
    expect(advanceAll(`(fn first [a b] a) (first 1 2)`)).toEqual(1)
    expect(advanceAll(`(fn second [a b] b) (second 1 2)`)).toEqual(2)
  })

  it('scope', () => {
    expect(
      advanceAll(`
        (fn b [name] name)
        (fn a [name] (b "name 2"))
        (a "name")
      `)
    ).toEqual('name 2')
  })

  it('errors with wrong argument counts', () => {
    expect(() => advanceAll(`(fn hi [a b] 1) (hi)`)).toThrow(
      /wanted 2 arguments, got 0/
    )
    expect(() => advanceAll(`(fn hi [] 1) (hi 1)`)).toThrow(
      /wanted 0 arguments, got 1/
    )
  })
})

it('nested calls', () => {
  expect(advanceAll(`(+ 1 (+ 2 3))`)).toEqual(6)
})

it('lists', () => {
  expect(advanceAll(`[1 2]`)).toEqual([1, 2])
})

it('order of operations', () => {
  expect(advanceAll(`[ 1 [ [ 2 3 ] 4 ] ]`)).toEqual([1, [[2, 3], 4]])
})

it('running AST directly', () => {
  expect(advanceAll(['do', ['literal', 1], ['literal', 2]])).toEqual(2)
})

it('call library functions', () => {
  const plusOne = jest.fn((a, b) => a + b + 1)

  expect(
    advanceAll(['do', ['call', 'plusOne', ['literal', 10], ['literal', 2]]], {
      plusOne,
    })
  ).toEqual(13)

  expect(plusOne).toHaveBeenCalledTimes(1)
  expect(plusOne).toHaveBeenCalledWith(10, 2)
})

describe('interrupting', () => {
  it('can yield stuff', () => {
    expect(getAllYielded(`(yield 1) (yield 2)`)).toEqual([1, 2])
    expect(
      getAllYielded(`
        (fn yieldTwo [thing]
          (yield thing)
          (yield (+ thing 1)))

        (yieldTwo 10)
        (yieldTwo 20)
      `)
    ).toEqual([10, 11, 20, 21])
  })

  it('can return a ticket and get yielded', () => {
    const code = `
      [ (fetch "http://example.com/1")
        (fetch "http://example.com/2") ]
    `
    const program = createProgram(code, {
      fetch: (url) => new Ticket(url),
    })
    const state = getInitialState()

    const [status, returned] = evaluate(program, state)

    expect(status).toEqual('yielded')
    expect(returned).toEqual(new Ticket('http://example.com/1'))

    satisfyYield(program, state, 1)
    const [status2, returned2] = evaluate(program, state)

    expect(status2).toEqual('yielded')
    expect(returned2).toEqual(new Ticket('http://example.com/2'))

    satisfyYield(program, state, 2)
    expect(evaluate(program, state)).toEqual(['finished', [1, 2]])
  })
})

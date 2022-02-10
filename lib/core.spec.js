import { jest } from '@jest/globals'
import {
  createProgram,
  evaluate,
  parse,
  satisfyYield,
  createState,
  Ticket,
} from './core.js'
import { WaitTicket } from './ticket.js'

const ensureJSONStringifiable = (state) => {
  const serializedState = JSON.stringify(state)
  expect(state).toEqual(JSON.parse(serializedState))
}

const getAllYielded = (code) => {
  const program = createProgram({ code })
  const state = createState()

  const yieldedList = []
  let execLimit = 100
  while (state.runStatus !== 'finished') {
    const [status, yielded] = evaluate(program, state)

    ensureJSONStringifiable(state)

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
const advanceAll = (code, { library } = {}) => {
  const program = createProgram({ code, library })
  const state = createState()

  const [status, returned] = evaluate(program, state)

  expect(status).toEqual('finished')
  expect(state.runStatus).toEqual('finished')
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

it('literals', () => {
  expect(advanceAll(`[true false null]`)).toEqual([true, false, null])
  expect(advanceAll(`[-1 0 1]`)).toEqual([-1, 0, 1])
})

it('nested calls', () => {
  expect(advanceAll(`(== true (> 2 3))`)).toEqual(false)
})

it('errors', () => {
  const getThrown = (code) => {
    try {
      advanceAll(code)
    } catch (error) {
      return error
    }
    throw new Error('missing expected exception')
  }

  expect(getThrown(`(== "too" "many" "args")`)).toMatchInlineSnapshot(
    `[Error: == expects 2 arguments, but got 3]`
  )
  expect(getThrown(`(missingFunction)`)).toMatchInlineSnapshot(
    `[Error: Missing function missingFunction]`
  )
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

describe('external things', () => {
  it('library functions', () => {
    const plusOne = jest.fn((a, b) => a + b + 1)

    expect(advanceAll(`(plusOne 10 2)`, { library: { plusOne } })).toEqual(13)

    expect(plusOne).toHaveBeenCalledTimes(1)
    expect(plusOne).toHaveBeenCalledWith(10, 2)
  })

  it('inserted', () => {
    const equal = parse`(== 2 ${2})`
    expect(advanceAll(equal)).toEqual(true)
  })

  it('inserted functions', () => {
    const plus = (a, b) => a + b
    const three = parse`(${plus} 1 2)`
    expect(advanceAll(three)).toEqual(3)
  })
})

describe('interrupting', () => {
  it('can yield stuff', () => {
    expect(getAllYielded(`(yield 1) (yield 2)`)).toEqual([1, 2])
    expect(
      getAllYielded(`
        (fn yieldTwo [thing]
          (yield thing)
          (yield (== thing 10)))

        (yieldTwo 10)
        (yieldTwo 20)
      `)
    ).toEqual([10, true, 20, false])
  })

  it('can return a ticket and get yielded', () => {
    const code = `
      [ (fetch "http://example.com/1")
        (fetch "http://example.com/2") ]
    `
    const program = createProgram({
      library: { fetch: (url) => new Ticket(url) },
      code,
    })
    const state = createState()

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

describe('registering timers', () => {
  it('can yield a ticket that waits', () => {
    const waitUntil = Date.now() + 1000

    const program = createProgram({
      code: parse`(wait ${waitUntil})`,
    })
    const state = createState()

    const [status, returned] = evaluate(program, state)
    expect(returned).toEqual(new WaitTicket(waitUntil))
    expect(status).toEqual('yielded')
  })
})

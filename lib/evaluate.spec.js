import { createState } from './state.js'
import { evaluateLowLevel } from './evaluate.js'

it('can push', () => {
  expect(testEvaluate(['push', 1]).stack).toEqual([1])
})

it('can load a variable', () => {
  expect(testEvaluate(['load', 'testVar']).stack).toEqual(['test'])
  expect(() => testEvaluate(['load', 'nope'])).toThrow(/nope/)
})

it('can execute core functions "do" and "list"', () => {
  expect(testEvaluate(['list', 2], { stack: ['trash', 1, 2] }).stack).toEqual([
    'trash',
    [1, 2],
  ])
  expect(testEvaluate(['list', 0], { stack: ['trash'] }).stack).toEqual([
    'trash',
    [],
  ])

  expect(
    testEvaluate(['do', 2], { stack: ['trash', 'discard', 1] }).stack
  ).toEqual(['trash', 1])
})

it('can call regular old functions', () => {
  expect(
    testEvaluate(['call', (x) => x + 1, 1], { stack: ['trash', 10] }).stack
  ).toEqual(['trash', 11])
})

it('can call builtins', () => {
  expect(
    testEvaluate(['call', '==', 2], { stack: ['trash', 3, 3] }).stack
  ).toEqual(['trash', true])

  expect(
    testEvaluate(['call', '!=', 2], { stack: ['trash', 3, 3] }).stack
  ).toEqual(['trash', false])
})

it('rejects unknown fn calls', () => {
  expect(() =>
    testEvaluate(['call', 1], { stack: ['unknownbuiltin', 1] })
  ).toThrow(/missing function/i)
})

it('rejects wrong arg count', () => {
  expect(() => testEvaluate(['call', 'negate', 2], { stack: [1, 2] })).toThrow()
})

it('rejects garbage instructions', () => {
  expect(() => testEvaluate(['unknown', 123])).toThrow(/unknown instruction/)
})

function testEvaluate(instruction, { stack = [] } = {}) {
  const state = createState()
  state.stack = stack
  state.variables.testVar = 'test'

  const startingSerializedState = JSON.stringify(state)

  const func = {
    functionName: '',
    functionArgs: [],
    instructions: [instruction],
  }

  evaluateLowLevel({ functions: { '': func } }, state)

  // Make sure serialization works
  {
    const endSerializedState = JSON.stringify(state)
    const restoredState = JSON.parse(startingSerializedState)

    evaluateLowLevel({ functions: { '': func } }, restoredState)

    expect(JSON.stringify(state)).toEqual(endSerializedState)
  }

  return state
}

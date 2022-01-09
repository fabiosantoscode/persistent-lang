import { validateState, createState, pushValue } from './state.js'
import { createProgram } from './core.js'

it('validates state', () => {
  const testValidate = (overrides) =>
    validateState(Object.assign(createState(), overrides))

  expect(() => testValidate({})).not.toThrow()
  expect(() => testValidate({ runStatus: 'yielded' })).toThrow(
    /program has yielded/i
  )
  expect(() => testValidate({ runStatus: 'finished' })).toThrow(
    /program has already ended/i
  )
})

it('validates pushed values', () => {
  const program = createProgram({ code: '1' })
  const state = createState()

  pushValue(program, state, 1)
  expect(state.stack).toEqual([1])
  expect(() => pushValue(program, state, () => {})).toThrow(/unserializable/)
})

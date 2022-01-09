import { validateState, getInitialState } from './state.js'

it('validates state', () => {
  const testValidate = (overrides) =>
    validateState(Object.assign(getInitialState(), overrides))

  expect(() => testValidate({})).not.toThrow()
  expect(() => testValidate({ runStatus: 'yielded' })).toThrow(
    /program has yielded/i
  )
  expect(() => testValidate({ runStatus: 'finished' })).toThrow(
    /program has already ended/i
  )
})

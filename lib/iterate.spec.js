import { validateState, getInitialState } from './iterate.js'

it('validates state', () => {
  const testValidate = (overrides) =>
    validateState(Object.assign(getInitialState(), overrides))

  expect(() => testValidate({})).not.toThrow()
  expect(() => testValidate({ runStatus: 'yielded' })).toThrow(
    /program has yielded/i
  )
  expect(() => testValidate({ runStatus: null })).toThrow(
    /program has already ended/i
  )
})

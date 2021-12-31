import { createProgram } from './core.js'
import { evaluate } from './evaluate.js'

const testEvaluate = (astOrCode) => evaluate(createProgram(astOrCode))
const testEvaluateAll = (astOrCode) => {
  const program = createProgram(astOrCode)
  let yielded, state

  while (true) {
    ;[yielded, state] = evaluate(program, state)
    if (!state) return yielded
  }
}

it('evaluates atoms', () => {
  expect(testEvaluate(1)[0]).toEqual(1)
  expect(testEvaluate(['/str', 'hi'])[0]).toEqual('hi')
})

it('evaluates do expr by recursing into it', () => {
  expect(testEvaluate(['do', 1])[1].path).toMatchInlineSnapshot(`
    Array [
      1,
    ]
  `)
})

it.skip('accumulates arrays and returns them', () => {
  expect(testEvaluateAll(['/list', 'hi', 'hewwo'])).toMatchInlineSnapshot(`
    Array [
      "hi",
      "hewwo",
    ]
  `)
})

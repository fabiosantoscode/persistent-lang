import { parse } from './parse.js'
import { evaluate } from './evaluate.js'

export function createProgram([code]) {
  const body = parse(code)
  const program = { functions: getFunctions(body) }

  return function advance(state) {
    return evaluate(program, state)
  }
}

function getFunctions (body) {
  const functions = Object.create(null)
  functions[''] = {
    functionName: '',
    functionArgs: [],
    functionBody: body
  }

  for (const stmt of body) {
    if (Array.isArray(stmt) && stmt[0] === 'fn') {
      const [_, { functionName, functionArgs, functionBody }] = stmt
      functions[functionName] = { functionName, functionArgs, functionBody }
    }
  }

  return functions
}

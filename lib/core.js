import { parse } from './parse.js'
import { evaluate } from './evaluate.js'

/**
 * Step forward in execution. *Mutates state argument*.
 * Call this function repeatedly until state is done.
 **/
export function advance(program, state) {
  return evaluate(program, state)
}

export function createProgram([code]) {
  const body = parse(code)
  const program = {
    functions: getFunctions(body)
  }
  return program
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
      const [_, functionName, functionArgs, functionBody] = stmt
      const fn = { functionName, functionArgs, functionBody }
      functions[fn.functionName] = fn
    }
  }

  return functions
}

import { toInstructions } from './instructions'
import { parse } from './parse.js'
import { evaluate } from './evaluate.js'

/**
 * Step forward in execution.
 * Call this function repeatedly until state is done.
 **/
export function advance(program, state) {
  return evaluate(program, state)
}

export function createProgram(ast) {
  if (typeof ast === 'string') {
    ast = parse(ast)
  }
  const program = { functions: getFunctions(ast) }
  return program
}

function getFunctions(body) {
  const functions = Object.create(null)
  functions[''] = {
    functionName: '',
    functionArgs: [],
    instructions: toInstructions(body),
  }

  if (Array.isArray(body)) {
    // We might be calling this with just a number or string.
    // Maybe this is not a good AST structure?
    for (const stmt of body) {
      if (Array.isArray(stmt) && stmt[0] === 'fn') {
        const [_, functionName, functionArgs, functionBody] = stmt
        const fn = {
          functionName,
          functionArgs,
          instructions: toInstructions(functionBody),
        }
        functions[fn.functionName] = fn
      }
    }
  }

  return functions
}

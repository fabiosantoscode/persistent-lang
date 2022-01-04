import { toInstructions } from './instructions.js'
import { parse } from './parse.js'

export function createProgram(ast, library = {}) {
  if (typeof ast === 'string') ast = parse(ast)

  const program = { functions: getFunctions(ast), library }
  return program
}

function getFunctions(body) {
  const functions = {}
  const addFunc = (functionName, functionArgs, body) => {
    functions[functionName] = {
      functionName,
      functionArgs,
      instructions: toInstructions(body),
    }
  }

  addFunc('', [], body)

  // We might be calling this with just a number or string.
  // Maybe this is not a good AST structure?
  for (const stmt of body) {
    if (stmt?.[0] === 'fn') {
      const [_, functionName, functionArgs, functionBody] = stmt
      addFunc(functionName, functionArgs, functionBody)
    }
  }

  return functions
}
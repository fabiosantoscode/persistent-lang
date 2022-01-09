import { toInstructions } from './instructions.js'
import { parse } from './parse.js'

export const createProgram = ({ library, code }) => {
  if (typeof code === 'string') {
    code = parse([code])
  }

  const program = { functions: getFunctions(code), library: library ?? {} }
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

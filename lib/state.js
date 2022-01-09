import { checkSerializable } from './utils.js'

// This module contains the program state, and methods to advance it.
//
// Major elements in the state are:
//
//  - stack, where temporary values are pushed
//  - pc, which is the index of the next instruction to execute
//  - functionName, which is the name of the currently running function, or '' for toplevel code
//  - callStack, a stack of functions. This is separated from the temporary value stack because it avoids bugs and eases creation of stack traces.

/** The default execution state of a program. */
export function createState() {
  return {
    pc: 0,
    stack: [],
    variables: {},
    runStatus: 'running', // Or 'yielded' when frozen, or 'finished' when the program ended.
    callStack: [],
    functionName: '',
  }
}

export function validateState(state) {
  switch (state.runStatus) {
    case 'yielded':
      throw new Error(
        'program has yielded. Call satisfyYield(program, state, yieldResponse)'
      )
    case 'finished':
      throw new Error('program has already ended')
  }
}

/** Get the currently running body (always a do-expression) */
export function getCurrentBody(program, state) {
  return program.functions[state.functionName].instructions
}

export function pushFunction(program, state, newFunctionName, args) {
  const { pc, functionName, variables } = state
  const { functionArgs } = program.functions[newFunctionName]

  if (functionArgs.length !== args.length) {
    throw new Error(
      functionName +
        ' wanted ' +
        functionArgs.length +
        ' arguments, got ' +
        args.length
    )
  }

  state.callStack.push({ pc, functionName, variables })

  const newVariables = Object.fromEntries(
    functionArgs.map((name, i) => [name, args[i]])
  )
  state.pc = 0
  state.functionName = newFunctionName
  state.variables = newVariables
}

export function popFunction(program, state) {
  if (state.callStack.length) {
    const { pc, functionName, variables } = state.callStack.pop()
    state.pc = pc
    state.functionName = functionName
    state.variables = variables
  } else {
    state.runStatus = 'finished'
  }
}

export function pushValue(program, state, value) {
  if (!checkSerializable(value)) {
    throw new Error('pushing an unserializable value ' + value)
  }
  state.stack.push(value)
}

export function yieldValue(program, state, yielded) {
  state.runStatus = 'yielded'
  // Don't validate this because it may be a Ticket!
  state.stack.push(yielded)
}

export function satisfyYield(program, state, unyielded) {
  state.runStatus = 'running'
  pushValue(program, state, unyielded)
}

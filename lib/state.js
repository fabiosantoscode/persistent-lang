// This module contains the primitives used to iterate the AST
//
// Because of freezability, we can't use:
//
//  - For loops
//  - .forEach or .map
//  - Continuations (callbacks)
//
// To traverse the tree.
//
// Instead, we expect to be called a bunch of times. Every time we're called we need to
// understand where we are in the AST, and every time we return we need to
// say where the next iteration will jump to.
//
// The functions below help manage this, en lieu of proper control flow primitives.

/** The default execution state of a program. */
export function getInitialState() {
  return {
    pc: 0,
    stack: [],
    variables: {},
    runStatus: 'running', // Or "yielded", or null when the program ended.
    yielded: null,
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
    case null:
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
    state.runStatus = null
  }
}

export function yieldValue(program, state, yielded) {
  state.yielded = yielded
  state.runStatus = 'yielded'
}

export function satisfyYield(program, state, unyielded) {
  state.runStatus = 'running'
  state.yielded = null
  state.stack.push(unyielded)
}

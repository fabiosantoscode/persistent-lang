/** The default execution state of a program. */
export function getDefaultState() {
  return { path: [], pathsStack: [], functionName: '' }
}

/** Get the currently running body (always a do-expression) */
function getCurrentBody(program, state) {
  return program.functions[state.functionName].functionBody
}

/** Return atom or form at `path` */
export function getAt(atom, path) {
  const cursor = [...path].reverse()

  while (cursor.length) {
    atom = atom[cursor.pop()]
  }

  return atom
}

export function advanceIteration(program, state) {
  const body = getCurrentBody(program, state)
  const popped = [...state.path]
  const last = popped.pop()

  const justGoToNext = [...popped, last + 1]

  if (getAt(body, justGoToNext) != null) {
    // Next argument of this function, item in this list, etc.
    return { ...state, path: justGoToNext }
  } else if (popped.length) {
    // Reached end of iteration at this level, let's pop
    return advanceIteration(program, { ...state, path: popped })
  } else if (state.pathsStack.length) {
    // Reached the end of this bit of the stack
    return advanceIteration(program, popStack(program, state))
  } else {
    // Reached the end of the program
    return null
  }
}

export function pushStack(
  program,
  { functionName, path, pathsStack, ...state },
  newFunctionName
) {
  const currentStackFrame = { functionName, path }
  return {
    ...state,
    functionName: newFunctionName,
    path: [],
    pathsStack: [...pathsStack, currentStackFrame],
  }
}

export function popStack(program, { pathsStack, ...state }) {
  pathsStack = [...pathsStack]
  const { functionName, path } = pathsStack.pop()
  return {
    ...state,
    functionName,
    path,
    pathsStack,
  }
}

export function getCurrent(program, state) {
  return getAt(getCurrentBody(program, state), state.path)
}

import {
  getCurrent,
  getDefaultState,
  advanceIteration,
  pushStack,
} from './iterate.js'

const HOP = {}.hasOwnProperty

export function evaluate(program, state = getDefaultState()) {
  const currentAtom = getCurrent(program, state)

  if (!Array.isArray(currentAtom)) {
    // It's a literal
    if (currentAtom == null) {
      throw new Error('panic')
    }
    return [currentAtom, advanceIteration(program, state)]
  }

  const [type, ...args] = currentAtom
  switch (type) {
    case 'do': {
      const path = state.path.concat(1)
      return [null, { ...state, path }]
    }
    case 'fn': {
      // Functions arent evaluated, they just exist
      return [null, advanceIteration(program, state)]
    }
    case '/str': {
      return [args[0], advanceIteration(program, state)]
    }
    case '/list': {
      return [args[0], advanceIteration(program, state)]
    }
    default: {
      // Call a function of that name
      if (HOP.call(program.functions, type)) {
        return [null, pushStack(program, state, type)]
      }

      throw new Error('unknown function ' + type)
    }
  }
}

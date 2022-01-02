import {
  getCurrentBody,
  getInitialState,
  pushFunction,
  popFunction,
} from './iterate.js'

const HOP = {}.hasOwnProperty

const coreFns = {
  do(...args) {
    return args[args.length - 1]
  },
  list(...args) {
    return args
  },
}
const builtins = {
  ...coreFns,
  '+'(...args) {
    return args.reduce((a, b) => a + b, 0)
  },
}

export function evaluate(program, state) {
  const body = getCurrentBody(program, state)
  if (state.pc >= body.length) {
    popFunction(program, state)
    return
  }

  const [instruction, instructionArg] = body[state.pc++]
  switch (instruction) {
    case 'push': {
      state.stack.push(instructionArg)
      break
    }

    case 'load': {
      // TODO load plain old variables too
      if (
        HOP.call(builtins, instructionArg) ||
        HOP.call(program.functions, instructionArg)
      ) {
        state.stack.push(instructionArg)
      } else if (HOP.call(state.variables, instructionArg)) {
        state.stack.push(state.variables[instructionArg])
      } else {
        throw new Error('Missing variable ' + instructionArg)
      }
      break
    }

    case 'do':
    case 'list': {
      // Get last {instructionArg} items
      const args = instructionArg ? state.stack.splice(-instructionArg) : []

      state.stack.push(coreFns[instruction](...args))
      break
    }

    case 'call': {
      // Get last {instructionArg} items
      const [fname, ...args] = state.stack.splice(-(instructionArg + 1))

      if (HOP.call(program.functions, fname)) {
        pushFunction(program, state, fname, args)
      } else if (HOP.call(builtins, fname)) {
        state.stack.push(builtins[fname](...args))
      } else {
        throw new Error('Missing function ' + fname)
      }

      break
    }

    default: {
      throw new Error('unknown instruction ' + instruction)
    }
  }
}

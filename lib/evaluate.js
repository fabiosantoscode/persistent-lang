import {
  getCurrentBody,
  getInitialState,
  pushFunction,
  popFunction,
} from './iterate.js'
import { coreFns, builtins } from './builtins'

const HOP = {}.hasOwnProperty

/**
 * Step forward in execution.
 * Call this function repeatedly until state is done.
 **/
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
      if (
        HOP.call(builtins, instructionArg) ||
        HOP.call(program.functions, instructionArg)
      ) {
        // TODO distinguish pushed func refs from pushed strings
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
        const builtin = builtins[fname]

        if (builtin.length > 0 && builtin.length !== args.length) {
          throw new Error(
            fname + ' expects ' + builtin.length + ', got ' + args.length
          )
        }

        state.stack.push(builtin(...args))
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

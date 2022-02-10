import { hasOwn, readFromAny } from './utils.js'
import {
  getCurrentBody,
  validateState,
  pushFunction,
  popFunction,
  yieldValue,
  pushValue,
} from './state.js'
import { Ticket } from './ticket.js'
import { builtins } from './builtins.js'

export function evaluate(program, state) {
  validateState(state)

  while (state.runStatus === 'running') {
    evaluateLowLevel(program, state)
  }

  return [state.runStatus, state.stack.pop()]
}

/**
 * Step forward in execution.
 * Call this function repeatedly until state is done.
 **/
export function evaluateLowLevel(program, state) {
  validateState(state)

  const body = getCurrentBody(program, state)
  if (state.pc >= body.length) {
    popFunction(program, state)
    return
  }

  /** Get last {n} items */
  const popMany = (n) => (n ? state.stack.splice(-n) : [])

  const [instruction, instructionArg, instructionArg2] = body[state.pc++]
  switch (instruction) {
    case 'push': {
      pushValue(program, state, instructionArg)

      break
    }

    case 'load': {
      if (hasOwn(state.variables, instructionArg)) {
        pushValue(program, state, state.variables[instructionArg])
      } else {
        const availableVars = `Available variables: ${Object.keys(
          state.variables
        ).join(', ')}`
        throw new Error(
          'Missing variable ' + instructionArg + '\n' + availableVars
        )
      }

      break
    }

    case 'do':
    case 'list': {
      const returned = builtins[instruction](...popMany(instructionArg))
      pushValue(program, state, returned)

      break
    }

    case 'yield': {
      yieldValue(program, state, state.stack.pop())

      break
    }

    case 'call': {
      const func = instructionArg
      const args = popMany(instructionArg2)

      const callable =
        typeof func === 'function'
          ? // Inserted with ${fn}
            func
          : // Try library, then builtins
            readFromAny(func, program.library, builtins)

      if (callable) {
        if (callable.length > 0 && callable.length !== args.length) {
          throw new Error(
            func +
              ' expects ' +
              callable.length +
              ' arguments, but got ' +
              args.length
          )
        }

        const ret = callable(...args)

        // Library functions can return a ticket and get it fulfilled.
        // Let's ask the caller to call us back with a response to it.
        if (ret instanceof Ticket) {
          yieldValue(program, state, ret)
        } else {
          pushValue(program, state, ret)
        }
      } else if (hasOwn(program.functions, func)) {
        pushFunction(program, state, func, args)
      } else {
        throw new Error('Missing function ' + func)
      }

      break
    }

    default: {
      throw new Error('unknown instruction ' + instruction)
    }
  }
}

import {
  getCurrentBody,
  getInitialState,
  validateState,
  pushFunction,
  popFunction,
  yieldValue,
} from './iterate.js'
import { builtins } from './builtins'

const HOP = {}.hasOwnProperty

export function evaluate(program, state) {
  validateState(state)

  while (state.runStatus === 'running') {
    evaluateLowLevel(program, state)
  }

  if (state.runStatus === 'yielded') {
    return ['yielded', state.yielded]
  } else {
    return ['finished', state.stack.pop()]
  }
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

  const [instruction, instructionArg] = body[state.pc++]
  switch (instruction) {
    case 'push': {
      state.stack.push(instructionArg)

      break
    }

    case 'load': {
      if (HOP.call(state.variables, instructionArg)) {
        state.stack.push(state.variables[instructionArg])
      } else {
        throw new Error('Missing variable ' + instructionArg)
      }

      break
    }

    case 'do':
    case 'list': {
      const returned = builtins[instruction](...popMany(instructionArg))
      state.stack.push(returned)

      break
    }

    case 'yield': {
      yieldValue(program, state, state.stack.pop())

      break
    }

    case 'call': {
      const [fname, ...args] = popMany(instructionArg + 1)

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

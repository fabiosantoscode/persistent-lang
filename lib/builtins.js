import { WaitTicket } from './ticket.js'

const comparisonOperators = (() => {
  const eq = (a, b) => a === b
  const neq = (a, b) => a !== b

  /* istanbul ignore next */
  return {
    '==': eq,
    '===': eq,
    '!=': neq,
    '!==': neq,
    '>': (a, b) => a > b,
    '>=': (a, b) => a >= b,
    '<': (a, b) => a < b,
    '<=': (a, b) => a <= b,
  }
})()

const timingFunctions = {
  wait: (until) => new WaitTicket(until),
}

/** Builtin functions can be overridden if the user declares them */
export const builtins = {
  do: (...args) => args[args.length - 1],
  list: (...args) => args,
  ...comparisonOperators,
  ...timingFunctions,
}

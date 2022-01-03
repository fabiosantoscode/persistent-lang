/* istanbul ignore next */
const numberOperators = (() => {
  const comparing =
    (fn) =>
    (...values) => {
      if (values.length < 2) {
        throw new Error('Need at least 2 arguments')
      }
      return values.every(
        (item, i) => i === values.length - 1 || fn(item, values[i + 1])
      )
    }

  const reducing =
    (fn) =>
    (...values) => {
      if (values.length === 0) {
        throw new Error('Need at least 1 argument')
      }
      return values.reduce(fn)
    }

  return {
    '+': reducing((a, b) => a + b),
    '-': reducing((a, b) => a - b),
    '*': reducing((a, b) => a * b),
    '/': reducing((a, b) => a / b),
    '==': comparing((a, b) => a === b),
    '!=': comparing((a, b) => a !== b),
    '>': comparing((a, b) => a > b),
    '>=': comparing((a, b) => a >= b),
    '<': comparing((a, b) => a < b),
    '<=': comparing((a, b) => a <= b),
  }
})()

/** Builtin functions can be overridden if the user declares them */
export const builtins = {
  do(...args) {
    return args[args.length - 1]
  },
  list(...args) {
    return args
  },
  ...numberOperators,
}

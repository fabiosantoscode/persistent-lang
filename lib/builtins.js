import { WaitTicket } from './ticket.js'

const numberOperators = (() => {
  const ensureArgCount = (args, count) => {
    if (args.length < count) {
      const plural = count > 1 ? 's' : ''
      throw new TypeError('Need at least ' + count + ' argument' + plural)
    }
  }
  const everyTypeof = (items, type) =>
    items.every((item) => typeof item === type)
  const allNumberOrAllString = (items) =>
    everyTypeof(items, 'number') || everyTypeof(items, 'string')

  const adding = (...values) => {
    ensureArgCount(values, 1)
    if (!values.every((v) => typeof v === 'string' || typeof v === 'number')) {
      throw new Error('Mismatched types')
    }
    if (!everyTypeof(values, 'number')) {
      // One or more strings exist: we just join
      return values.join('')
    }
    return values.reduce((a, b) => a + b)
  }

  const comparing =
    (fn) =>
    (...values) => {
      ensureArgCount(values, 2)
      if (!allNumberOrAllString(values)) {
        throw new Error('Mismatched types')
      }
      return values.every((item, i) => {
        const next = values[i + 1]
        return next == null || fn(item, next)
      })
    }

  const reducing =
    (fn) =>
    (...values) => {
      ensureArgCount(values, 1)
      if (!everyTypeof(values, 'number')) {
        throw new Error('Mismatched types')
      }
      return values.reduce(fn)
    }

  /* istanbul ignore next */
  return {
    '+': adding,
    '-': reducing((a, b) => a - b),
    negate: (a) => -a,
    '*': reducing((a, b) => a * b),
    '/': reducing((a, b) => a / b),
    '==': comparing((a, b) => a === b),
    '===': comparing((a, b) => a === b),
    '!=': comparing((a, b) => a !== b),
    '!==': comparing((a, b) => a !== b),
    '>': comparing((a, b) => a > b),
    '>=': comparing((a, b) => a >= b),
    '<': comparing((a, b) => a < b),
    '<=': comparing((a, b) => a <= b),
  }
})()

const timingOperators = {
  wait(until) {
    return new WaitTicket(until)
  },
}

/** Builtin functions can be overridden if the user declares them */
export const builtins = {
  do(...args) {
    return args[args.length - 1]
  },
  list(...args) {
    return args
  },
  ...numberOperators,
  ...timingOperators,
}

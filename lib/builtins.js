/** Core functions are callable with a call instruction, or without a call instruction */
export const coreFns = {
  do(...args) {
    return args[args.length - 1]
  },
  list(...args) {
    return args
  },
}

/** Builtin functions can be overridden if the user declares them */
export const builtins = {
  ...coreFns,
  '+'(...args) {
    return args.reduce((a, b) => a + b, 0)
  },
}

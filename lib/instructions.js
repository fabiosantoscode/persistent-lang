export function toInstructions(ast) {
  const program = []
  ;(function recurse([type, ...args]) {
    switch (type) {
      case 'literal': {
        program.push(['push', args[0]])
        break
      }

      case 'identifier': {
        program.push(['load', args[0]])
        break
      }

      // don't recurse into inner functions -- let static analysis find out
      case 'fn':
        break

      case 'list':
      case 'do': {
        for (const arg of args) {
          recurse(arg)
        }
        program.push([type, args.length])
        break
      }

      case 'yield': {
        recurse(args[0])
        program.push(['yield'])
        break
      }

      case 'call': {
        let [[funcType, funcNameOrFunc], ...callArgs] = args

        /* istanbul ignore next */
        if (funcType !== 'identifier' && funcType !== 'literal') {
          throw new Error('invalid AST')
        }

        for (const arg of callArgs) {
          recurse(arg)
        }
        program.push(['call', funcNameOrFunc, callArgs.length])
        break
      }

      default: {
        throw new Error('unknown AST node ' + type)
      }
    }
  })(ast)
  return program
}

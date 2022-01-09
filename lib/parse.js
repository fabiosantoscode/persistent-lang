import { getTokens } from './tokenizer.js'
import { checkSerializable } from './utils.js'

export function parse(sources, ...inserts) {
  const tokens = Array.from(getTokens(sources, ...inserts))

  /** The current token. Advances when consume() is called. */
  function bork(message) {
    return new SyntaxError(
      message + '\n\n' + drawError(sources, inserts, current())
    )
  }

  let tokenIndex = 0
  const consume = () => tokens[tokenIndex++]
  const current = () => tokens[tokenIndex]

  const expect = (type) => {
    const tok = consume()
    if (type !== tok.type) {
      throw bork(`expected ${type}, got ${tok.type}`)
    }
    return tok
  }

  const parseReference = ({ mustBeSerializable = false } = {}) => {
    // Accept a word or insert
    switch (current().type) {
      case 'insert': {
        const value = consume().value

        if (mustBeSerializable && !checkSerializable(value)) {
          throw bork('cannot insert a non-serializable value in this context')
        }

        return ['literal', value]
      }
      case 'word': {
        return ['identifier', consume().value]
      }
      default: {
        throw bork(`expected word, or template string insersion`)
      }
    }
  }

  /** Parse until {endType} token is found. */
  const parseUntil = (endType) => {
    const list = []
    while (current().type !== endType) {
      list.push(parseExpression())
    }
    expect(endType) // {endType} token
    return list
  }

  const functionArgumentList = () => {
    const argNames = []
    expect('squareBracketStart')
    while (current().type !== 'squareBracketEnd') {
      argNames.push(expect('word').value)
    }
    expect('squareBracketEnd')
    return argNames
  }

  const parseExpression = () => {
    switch (current().type) {
      // Literals
      case 'stringSq':
      case 'stringDq':
      case 'number': {
        return ['literal', consume().value]
      }

      // Someone's inserted stuff using ${}
      // Or typed a name
      case 'insert':
      case 'word': {
        return parseReference({ mustBeSerializable: true })
      }

      // Function-like forms
      case 'parenStart': {
        consume()

        if (current().type === 'word') {
          const formHead = current().value

          if (formHead === 'fn') {
            consume()
            const functionName = expect('word').value
            const functionArgs = functionArgumentList()
            const functionBody = ['do', ...parseUntil('parenEnd')]

            return ['fn', functionName, functionArgs, functionBody]
          } else if (formHead === 'yield') {
            consume()
            const args = parseUntil('parenEnd')
            if (args.length > 1) {
              throw bork('yield takes only one argument')
            }

            return ['yield', args[0]]
          }
        }

        return ['call', parseReference(), ...parseUntil('parenEnd')]
      }
      case 'squareBracketStart': {
        consume()
        return ['list', ...parseUntil('squareBracketEnd')]
      }
      default: {
        throw bork('Unexpected ' + current().type)
      }
    }
  }

  const program = ['do']

  while (current().type !== 'end') {
    program.push(parseExpression())
  }

  return program
}

export function drawError(sources, inserts, token) {
  const lines = sources
    .map((source, i) => {
      const insert = i < sources.length - 1 ? `\${ ... }` : ''
      return source + insert
    })
    .join('')
    .split('\n')
  const theLine = lines[token.line - 1]

  return theLine + '\n' + ' '.repeat(token.col) + '^'
}

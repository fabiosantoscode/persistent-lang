import { getTokens } from './tokenizer.js'

export function parse(source) {
  const tokens = Array.from(getTokens(source))

  /** The current token. Advances when consume() is called. */
  function bork(message) {
    // TODO show error location
    return new SyntaxError(message)
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

      // References
      case 'word': {
        return ['identifier', consume().value]
      }

      case 'parenStart': {
        consume()

        if (current().value === 'fn') {
          consume()
          const functionName = expect('word').value
          const functionArgs = functionArgumentList()
          const functionBody = ['do', ...parseUntil('parenEnd')]

          return ['fn', functionName, functionArgs, functionBody]
        } else {
          return ['call', expect('word').value, ...parseUntil('parenEnd')]
        }
      }
      case 'squareBracketStart': {
        consume()
        return ['list', ...parseUntil('squareBracketEnd')]
      }
      default: {
        throw bork('Unexpected')
      }
    }
  }

  const program = ['do']

  while (current().type !== 'end') {
    program.push(parseExpression())
  }

  return program
}

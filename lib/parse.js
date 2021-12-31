import { getTokens } from './tokenizer.js'

export function parse(source) {
  const tokens = Array.from(getTokens(source))

  /** The current token. Advances when consume() is called. */
  let CURRENT = tokens[0]

  function bork(message) {
    // TODO show error location
    return new SyntaxError(message)
  }

  let i = 0
  const consume = () => {
    const tok = CURRENT
    i += 1
    CURRENT = tokens[i]
    if (tok == null) throw bork('fatal parse error')
    return tok
  }

  const expect = (type) => {
    const tok = consume()
    if (type !== tok?.type) {
      const humanTokName = tok?.type ?? 'end of file'
      throw bork(`expected ${type}, got ${humanTokName}`)
    }
    return tok
  }

  /** Parse until {endType} token is found. */
  const parseUntil = (endType) => {
    const list = []
    while (CURRENT.type !== endType) {
      list.push(parseExpression())
    }
    expect(endType) // {endType} token
    return list
  }

  const functionArgumentList = () => {
    const argNames = []
    expect('squareBracketStart')
    while (CURRENT.type !== 'squareBracketEnd') {
      argNames.push(expect('word').value)
    }
    expect('squareBracketEnd')
    return argNames
  }

  const parseExpression = () => {
    switch (CURRENT.type) {
      // Literals
      case 'stringSq':
      case 'stringDq':
      case 'number': {
        return consume().value
      }

      // Words (identifiers) and operators
      case 'word':
      case 'operator': {
        return consume().value
      }

      case 'parenStart': {
        consume()

        if (CURRENT.value === 'fn') {
          consume()
          const functionName = expect('word').value
          let functionArgs = ['/list']
          if (CURRENT.type === 'squareBracketStart') {
            functionArgs = ['/list', ...functionArgumentList()]
          }
          const functionBody = ['do', ...parseUntil('parenEnd')]

          return ['fn', functionName, functionArgs, functionBody]
        } else {
          return parseUntil('parenEnd')
        }
      }
      case 'squareBracketStart': {
        consume()
        return ['/list', parseUntil('squareBracketEnd')]
      }
      default: {
        throw bork('Unexpected')
      }
    }
  }

  const program = ['do']

  while (i < tokens.length) {
    if (tokens[i].type === 'end') {
      break
    }
    program.push(parseExpression())
  }

  return program
}

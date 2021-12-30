import moo from 'moo'

const mathOps = ['+', '\\-', '*', '/']
const cmpOps = ['>', '<', '>=', '<=', '==', '!=']
const operatorRegExp = `[${[...mathOps, ...cmpOps].join('')}]`

const stringValue = (tok) =>
  ['/str', tok.slice(1, -1).replace(/\\"/g, '"')]

const numberValue = (tok) => Number(tok)

const tokenizer = moo.compile({
  ws: /[ \t]+/u,
  nl: { match: /\n/u, lineBreaks: true },
  operator: new RegExp(operatorRegExp, 'u'),
  parenStart: /\(/u,
  parenEnd: /\)/u,
  squareBracketStart: /\[/u,
  squareBracketEnd: /\]/u,
  stringDq: { match: /"(?:[^"]|\\")+"/u, value: stringValue },
  stringSq: { match: /'(?:[^']|\\')+'/u, value: stringValue },
  word: /\p{ID_Start}\p{ID_Continue}*/u,
  number: { match: /0|[1-9][0-9]*/u, value: numberValue },
  error: moo.error
})

export const parse = (source) => {
  const tokens = Array.from(tokenizer.reset(source)).flatMap(token => {
    if (token.type === 'ws' || token.type === 'nl') {
      return []
    } else {
      return [token]
    }
  })

  let i = 0

  const consume = () => {
    const tok = tokens[i]
    i += 1
    return tok
  }

  const expect = (type) => {
    const tok = consume()
    if (type !== tok?.type) {
      const humanTokName = tok?.type ?? 'end of file'
      throw new Error(`expected ${type}, got ${humanTokName}`)
    }
    return tok
  }

  const peek = () => {
    if (i > tokens.length) return ''
    return tokens[i]
  }

  const expressionList = (endType) => {
    const list = []
    while (peek() && peek().type !== endType) {
      list.push(parseExpression())
    }
    expect(endType)  // {endType} token
    return list
  }

  const functionArgumentList = () => {
    const argNames = []
    expect('squareBracketStart')
    while (peek() && peek().type !== 'squareBracketEnd') {
      argNames.push(expect('word').value)
    }
    expect('squareBracketEnd')
    return argNames
  }

  const array = () => {
    expect('squareBracketStart')
    return ['/list', ...expressionList('squareBracketEnd')]
  }

  const parseExpression = () => {
    switch (peek().type) {
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

        if (peek().value === 'fn') {
          consume()
          const functionName = expect('word').value
          let functionArgs = []
          if (peek().type === 'squareBracketStart') {
            functionArgs = functionArgumentList()
          }
          const functionBody = [
            'do',
            ...expressionList('parenEnd')
          ]
          return ['fn', { functionName, functionArgs, functionBody }]
        } else {
          return expressionList('parenEnd')
        }
      }
      case 'squareBracketStart': {
        return array()
      }
      default: {
        throw new Error('Unexpected ' + peek())
      }
    }
  }

  const program = ['do']

  while (i < tokens.length) {
    program.push(parseExpression())
  }

  return program
}

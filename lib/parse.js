const whitespace = ' \n\r'
const binaryOperators = [
  '+',
  '-',
  '*',
  '/'
]
const comparisonOperators = [
  '>',
  '<',
  '>=',
  '<=',
  '==',
  '!='
]
const punc = '()[]{}:.-+#'
const strDelim = `'"`
const booleans = ['true', 'false']
const numberKeywords = ['NaN', 'Infinity']
const last = coll => coll[coll.length - 1]

exports.tokenize = (source) => {
  const tokens = []

  let i = 0
  let line = 1
  let col = 0

  const next = () => {
    if (i >= source.length) {
      throw new Error('trying to go past end')
    }
    const char = source[i]
    if (char === '\n') {
      line += 1
      col = 0
    }
    if (char === '\r') return next()
    i++
    col++
    return char
  }

  const peek = () => {
    if (i >= source.length) return ''
    else return source[i]
  }

  const isIdentifier = (start) => {
    const char = peek()
    if (start) {
      return /^[a-zA-Z_$]$/.test(char)
    }
    return isIdentifier(true) || /^[0-9-]$/.test(char) || char === '.'
  }

  const canBeOp = (start) => {
    if (peek() === '') {
      return false
    }
    const starters = binaryOperators
      .concat(comparisonOperators)
      .find(s => s.startsWith(start + peek()))
    if (start[0] === '/' && isIdentifier()) {
      throw new Error('Unexpected internal call')
    }
    return Boolean(starters)
  }

  const isNumeral = () => /^[0-9]$/.test(peek())

  const readString = () => {
    const endStr = next()
    const lines = []
    let line = ''
    let leadingWhitespace = 0
    let nonWhitespaceFound
    while (peek() && peek() !== endStr) {
      const ch = next()
      line += ch
      if (whitespace.includes(ch) && !nonWhitespaceFound) {
        leadingWhitespace++
      } else if (!whitespace.includes(ch)) {
        nonWhitespaceFound = true
      }
      if (ch === '\n') {
        lines.push([nonWhitespaceFound, leadingWhitespace, line])
        line = ''
        leadingWhitespace = 0
        nonWhitespaceFound = false
      }
    }
    if (line) {
      lines.push([nonWhitespaceFound, leadingWhitespace, line])
    }
    if (!peek()) {
      throw new Error('Unterminated string at ' + line + ':' + col)
    }
    next()
    if (lines.length > 1) {
      let leastLeadingWhitespace = Infinity
      for (let i = 0; i < lines.length; i++) {
        const [nonWhitespaceFound, leadingWhitespace] = lines[i]
        if (!nonWhitespaceFound) {
          lines.splice(i, 1)
          i--
          continue
        }

        if (leastLeadingWhitespace > leadingWhitespace) {
          leastLeadingWhitespace = leadingWhitespace
        }
      }
      if (lines.length && last(last(lines)[2]) === '\n') {
        last(lines)[2] = last(lines)[2].slice(0, -1)
      }
      return lines
        .map(([_, __, line]) =>
          line.slice(leastLeadingWhitespace))
        .join('')
    }
    return last(lines[0])
  }

  while (peek() !== '') {
    while (peek() && whitespace.includes(peek())) next()

    if (peek() === '') break

    if (punc.includes(peek())) {
      tokens.push(next())
    } else if (isNumeral()) {
      let num = ''
      while (isNumeral()) {
        num += next()
      }
      tokens.push(Number(num))
    } else if (isIdentifier(true)) {
      let ident = ''
      while (isIdentifier() && peek()) {
        ident += next()
      }
      if (booleans.includes(ident)) {
        tokens.push(JSON.parse(ident))
      } else if (numberKeywords.includes(ident)) {
        tokens.push(eval(ident))
      } else {
        tokens.push(ident)
      }
    } else if (strDelim.includes(peek())) {
      tokens.push(['/str', readString()])
    } else if (canBeOp('')) {
      let binOpSoFar = next()
      while (canBeOp(binOpSoFar)) {
        binOpSoFar += next()
      }
      tokens.push(binOpSoFar)
    } else {
      throw new Error('Syntax error at ' + line + ':' + col + ': unknown character ' + peek())
    }
  }

  return tokens
}

const parse = exports.parse = (source) => {
  const tokens = exports.tokenize(source)

  let i = 0

  const next = () => {
    const tok = tokens[i]
    i += 1
    return tok
  }

  const peek = () => {
    if (i > tokens.length) return ''
    return tokens[i]
  }

  const parseList = () => {
    next()
    const list = ['/list']
    while (peek() !== '' && peek() !== ']') {
      list.push(parseExpression())
    }
    next()
    return list
  }

  const parseExpression = () => {
    if (peek()[0] === '/str') {
      const str = next()
      return str
    } else if (typeof peek() === 'number') {
      return next()
    } else if (peek() === '(') {
      next()

      if (peek() === 'fn') {
        next()
        const functionName = next()
        let functionArgs = []
        if (peek() === '[') {
          functionArgs = parseList().slice(1)
        }
        const functionBody = ['do']
        while (peek() !== '' && peek() !== ')') {
          functionBody.push(parseExpression())
        }
        next()
        return ['fn', { functionName, functionArgs, functionBody }]
      } else {
        const sExpr = []
        while (peek() !== '' && peek() !== ')') {
          sExpr.push(parseExpression())
        }
        next()
        return sExpr
      }
    } else if (peek() === '[') {
      return parseList()
    } else if (/^[a-zA-Z$_-]+$/.test(peek())) {
      return next()
    } else if (binaryOperators.includes(peek()) || comparisonOperators.includes(peek())) {
      return next()
    } else {
      throw new Error('Unexpected ' + peek())
    }
  }

  const program = ['do']

  while (i < tokens.length) {
    program.push(parseExpression())
  }

  return program
}

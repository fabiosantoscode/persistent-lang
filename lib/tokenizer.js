import moo from 'moo'

const mathOps = ['+', '\\-', '*', '/']
const cmpOps = ['>', '<', '>=', '<=', '==', '!=']
const operatorRegExp = `[${[...mathOps, ...cmpOps].join('')}]`

const stringValue = (tok) => ['/str', tok.slice(1, -1).replace(/\\"/g, '"')]
const numberValue = (tok) => Number(tok)

export const tokenizer = moo.compile({
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
  error: moo.error,
})

export function* getTokens(source) {
  for (const tok of tokenizer.reset(source)) {
    if (tok.type !== 'ws' && tok.type !== 'nl') {
      yield tok
    }
  }
  yield { type: 'end', value: 'End of file', toString: () => 'end of input' }
}

import moo from 'moo'

const mathOps = ['\\+', '-', '\\*', '/']
const cmpOps = ['>=', '<=', '==', '!=', '>', '<']
const operatorRegExp = `(?:${[...mathOps, ...cmpOps].join('|')})`
const wordRegExp = '(?:\\p{ID_Start}\\p{ID_Continue}*)'

const stringValue = (tok) =>
  tok.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'")
const numberValue = (tok) => Number(tok)

export const tokenizer = moo.compile({
  ws: { match: /[\t \n]/u, lineBreaks: true },
  word: new RegExp(operatorRegExp + '|' + wordRegExp, 'u'),
  parenStart: /\(/u,
  parenEnd: /\)/u,
  squareBracketStart: /\[/u,
  squareBracketEnd: /\]/u,
  stringDq: { match: /"(?:[^"]|\\")+"/u, value: stringValue },
  stringSq: { match: /'(?:[^']|\\')+'/u, value: stringValue },
  number: { match: /0|[1-9][0-9]*/u, value: numberValue },
  error: moo.error,
})

export function* getTokens(source) {
  for (const tok of tokenizer.reset(source)) {
    if (tok.type !== 'ws') yield tok
  }
  yield { type: 'end', value: 'End of file' }
}

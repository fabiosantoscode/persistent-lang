import moo from 'moo'

const cmpOps = ['>=', '<=', '==', '===', '!=', '!==', '>', '<']
const operatorRegExp = `(?:${cmpOps.join('|')})`
const wordRegExp = '(?:\\p{ID_Start}\\p{ID_Continue}*)'

const stringValue = (tok) =>
  tok.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'")
const numberValue = (tok) => Number(tok)

export const tokenizer = moo.compile({
  comment: { match: /#.*/u },
  ws: { match: /[\t \n]/u, lineBreaks: true },
  word: new RegExp(operatorRegExp + '|' + wordRegExp, 'u'),
  parenStart: /\(/u,
  parenEnd: /\)/u,
  squareBracketStart: /\[/u,
  squareBracketEnd: /\]/u,
  stringDq: { match: /"(?:[^"]|\\")+"/u, value: stringValue },
  stringSq: { match: /'(?:[^']|\\')+'/u, value: stringValue },
  number: { match: /0|-?[1-9][0-9]*/u, value: numberValue },
  error: moo.error,
})

export function* getTokens(sources, ...inserts) {
  let line = 1
  let col = 1
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i]
    for (const tok of tokenizer.reset(source)) {
      ;({ line, col } = tok)
      if (tok.type !== 'ws' && tok.type !== 'comment') yield tok
    }

    if (i < inserts.length) {
      yield { type: 'insert', value: inserts[i], line, col }
    }
  }

  yield { type: 'end', value: 'End of file', line, col }
}

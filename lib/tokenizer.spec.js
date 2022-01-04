import { getTokens } from './tokenizer.js'

expect.addSnapshotSerializer({
  test: (thing) => thing.next && thing[Symbol.iterator],
  serialize: (thing) =>
    Array.from(thing)
      .map((token) => {
        if (token.type === 'end') {
          return 'end'
        } else {
          return `${token.type} ${token.value}`
        }
      })
      .join('; '),
})

it('tokenizes', () => {
  expect(getTokens('(a 12)')).toMatchInlineSnapshot(
    `parenStart (; word a; number 12; parenEnd ); end`
  )
  expect(getTokens('a1')).toMatchInlineSnapshot(`word a1; end`)
  expect(getTokens('[]')).toMatchInlineSnapshot(
    `squareBracketStart [; squareBracketEnd ]; end`
  )
})

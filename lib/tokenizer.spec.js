import { getTokens } from './tokenizer.js'

expect.addSnapshotSerializer({
  test: (thing) => thing.next && thing[Symbol.iterator],
  serialize: (thing) =>
    Array.from(thing)
      .map((token) => {
        if (token.type === 'end') {
          return 'end'
        } else if (token.type === 'insert') {
          return `insert ${token.value}`
        } else {
          return `${token.type} ${token.value}`
        }
      })
      .join('; '),
})

it('tokenizes', () => {
  expect(getTokens`(a 12)`).toMatchInlineSnapshot(
    `parenStart (; word a; number 12; parenEnd ); end`
  )
  expect(getTokens`a1`).toMatchInlineSnapshot(`word a1; end`)
  expect(getTokens`[]`).toMatchInlineSnapshot(
    `squareBracketStart [; squareBracketEnd ]; end`
  )
})

it('inserts crap', () => {
  expect(getTokens`1 ${'crap'} 2`).toMatchInlineSnapshot(
    `number 1; insert crap; number 2; end`
  )
  expect(getTokens`${() => 123} 2`).toMatchInlineSnapshot(
    `insert () => 123; number 2; end`
  )
  expect(getTokens`${10}`).toMatchInlineSnapshot(`insert 10; end`)
})

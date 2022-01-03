import { parse } from './parse'

const printSExpr = (expr) => {
  if (!Array.isArray(expr)) return JSON.stringify(expr)

  const [type, ...args] = expr
  if (type === 'literal') return JSON.stringify(args[0])

  return `(${type} ${args.map((a) => printSExpr(a)).join(' ')})`
}

expect.addSnapshotSerializer({
  test: (thing) => Array.isArray(thing) && typeof thing[0] === 'string',
  serialize: (thing) => printSExpr(thing),
})

it('borks at syntax errors', () => {
  expect(() => parse('(')).toThrow(SyntaxError)
  expect(() => parse(')')).toThrow(SyntaxError)

  expect(() => parse('( (')).toThrow(SyntaxError)
  expect(() => parse('( ( )')).toThrow(SyntaxError)

  expect(() => parse('[')).toThrow(SyntaxError)
  expect(() => parse(']')).toThrow(SyntaxError)

  expect(() => parse('[)')).toThrow(SyntaxError)
  expect(() => parse('(]')).toThrow(SyntaxError)
})

it('rejects the empty list', () => {
  expect(() => parse('()')).toThrow(SyntaxError)
  expect(parse('(unary)')).toMatchInlineSnapshot(`(do (call "unary"))`)
})

it('expects a correct function form', () => {
  expect(() => parse('(fn)')).toThrow(SyntaxError)
  expect(() => parse('(fn 10)')).toThrow(SyntaxError)
  expect(() => parse('(fn word notarray)')).toThrow(SyntaxError)
  expect(() => parse('(fn word [123])')).toThrow(SyntaxError)
  expect(() => parse('(fn word [a b 3)')).toThrow(SyntaxError)
  expect(() => parse('(fn word []')).toThrow(SyntaxError)
})

it('wraps everything in do', () => {
  expect(parse('1 2 3')).toMatchInlineSnapshot(`(do 1 2 3)`)
})

it('parses operators', () => {
  expect(parse('(> 1)')).toMatchInlineSnapshot(`(do (call ">" 1))`)
  expect(parse('(>= 1)')).toMatchInlineSnapshot(`(do (call ">=" 1))`)
})

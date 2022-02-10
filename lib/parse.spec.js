import { parse, drawError } from './parse.js'

const printSExpr = (expr) => {
  const toString = (thing) =>
    typeof thing === 'function' ? thing.toString() : JSON.stringify(thing)

  if (!Array.isArray(expr)) return toString(expr)

  const [type, ...args] = expr
  if (type === 'literal') return toString(args[0])

  return `(${type} ${args.map((a) => printSExpr(a)).join(' ')})`
}

expect.addSnapshotSerializer({
  test: (thing) => Array.isArray(thing) && thing[0] === 'do',
  serialize: (thing) => printSExpr(thing),
})

it('borks at syntax errors', () => {
  expect(() => parse`(`).toThrow(SyntaxError)
  expect(() => parse`)`).toThrow(SyntaxError)

  expect(() => parse`( (`).toThrow(SyntaxError)
  expect(() => parse`( ( )`).toThrow(SyntaxError)

  expect(() => parse`[`).toThrow(SyntaxError)
  expect(() => parse`]`).toThrow(SyntaxError)

  expect(() => parse`[)`).toThrow(SyntaxError)
  expect(() => parse`(]`).toThrow(SyntaxError)
})

it('rejects the empty list', () => {
  expect(() => parse`()`).toThrow(SyntaxError)
  expect(parse`(unary)`).toMatchInlineSnapshot(
    `(do (call (identifier "unary")))`
  )
})

it('expects a correct function form', () => {
  expect(() => parse`(fn)`).toThrow(SyntaxError)
  expect(() => parse`(fn 10)`).toThrow(SyntaxError)
  expect(() => parse`(fn word notarray)`).toThrow(SyntaxError)
  expect(() => parse`(fn word [123])`).toThrow(SyntaxError)
  expect(() => parse`(fn word [a b 3)`).toThrow(SyntaxError)
  expect(() => parse`(fn word []`).toThrow(SyntaxError)
})

it('wraps everything in do', () => {
  expect(parse`1 2 3`).toMatchInlineSnapshot(`(do 1 2 3)`)
})

it('parses operators', () => {
  expect(parse`(> 1)`).toMatchInlineSnapshot(`(do (call (identifier ">") 1))`)
  expect(parse`(>= 1)`).toMatchInlineSnapshot(`(do (call (identifier ">=") 1))`)
})

it('parses yield', () => {
  expect(parse`(yield 1)`).toMatchInlineSnapshot(`(do (yield 1))`)
  expect(() => parse`(yield 1 2)`).toThrow(SyntaxError)
})

it('parses inserts', () => {
  expect(parse`(== 1 ${2})`).toMatchInlineSnapshot(
    `(do (call (identifier "==") 1 2))`
  )
  const fn = (a) => 2
  expect(parse`(${fn} 1)`).toMatchInlineSnapshot(`(do (call a => 2 1))`)
})

it('validates inserts', () => {
  const fn = () => {}
  expect(() => parse`${fn}`).toThrow(SyntaxError)
  expect(() => parse`[ ${fn} ]`).toThrow(SyntaxError)
  // TODO nested expect(() => parse`[ ${[ { fn } ]} ]`).toThrow(SyntaxError)
  // TODO class instances
  // TODO nested class instances
})

it('draws syntax errors nicely', () => {
  // Used to get the first 2 args of drawError from a template string
  const t = (sources, ...inserts) => [sources, inserts]

  expect(drawError(...t`'hello world'`, { line: 1, col: 1 }))
    .toMatchInlineSnapshot(`
      "'hello world'
       ^"
    `)

  const multiLine = t`(+
  ${1}
  2)`

  expect(drawError(...multiLine, { line: 2, col: 3 })).toMatchInlineSnapshot(`
    "  \${ ... }
       ^"
  `)

  expect(drawError(...multiLine, { line: 3, col: 3 })).toMatchInlineSnapshot(`
    "  2)
       ^"
  `)
})

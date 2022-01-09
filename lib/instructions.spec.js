import { toInstructions } from './instructions.js'
import { parse } from './parse.js'

expect.addSnapshotSerializer({
  test: (thing) =>
    Array.isArray(thing) &&
    thing.every(
      (instruction) =>
        Array.isArray(instruction) && typeof instruction[0] === 'string'
    ),
  serialize: (instructions) =>
    instructions.map((ins) => ins.join(' ')).join('\n'),
})

it('turns a literal into instructions', () => {
  expect(toInstructions(parse`1`)).toMatchInlineSnapshot(`
    push 1
    do 1
  `)
  expect(toInstructions(parse`'str'`)).toMatchInlineSnapshot(`
    push str
    do 1
  `)
})

it('turns a "do" into instructions', () => {
  expect(
    toInstructions(
      parse`
        1
        2
      `
    )
  ).toMatchInlineSnapshot(`
    push 1
    push 2
    do 2
  `)
})

it('compiles nested calls', () => {
  expect(
    toInstructions(
      parse`
        1
        (do 2)
        (do (do 3) 4)
      `
    )
  ).toMatchInlineSnapshot(`
    push 1
    push 2
    call do 1
    push 3
    call do 1
    push 4
    call do 2
    do 3
  `)
})

it('compiles lists', () => {
  expect(toInstructions(parse`[1 2]`)).toMatchInlineSnapshot(`
    push 1
    push 2
    list 2
    do 1
  `)
})

it('compiles inserts', () => {
  const fn = (one) => one
  const fn2 = (two) => two
  expect(toInstructions(parse`(${fn} 1) (${fn2} ${1} 2)`))
    .toMatchInlineSnapshot(`
      push 1
      call one => one 1
      push 1
      push 2
      call two => two 2
      do 2
    `)

  expect(toInstructions(parse`[${1} ${2}]`)).toMatchInlineSnapshot(`
    push 1
    push 2
    list 2
    do 1
  `)
})

it('rejects invalid AST nodes', () => {
  expect(() => toInstructions(['do', ['invalid']])).toThrow(/unknown AST node/)
})

import { toInstructions } from './instructions.js'
import { parse } from './parse.js'

expect.addSnapshotSerializer({
  test: (thing) =>
    Array.isArray(thing) &&
    thing.every(
      (instruction) =>
        Array.isArray(instruction) &&
        typeof instruction[0] === 'string' &&
        instruction.length === 2
    ),
  serialize: (instructions) =>
    instructions.map((ins) => `${ins[0]} ${ins[1]}`).join('\n'),
})

it('turns a literal into instructions', () => {
  expect(toInstructions(parse('1'))).toMatchInlineSnapshot(`
    push 1
    do 1
  `)
  return
  expect(toInstructions(parse("'str'"))).toMatchInlineSnapshot(`
    push str
    do 1
  `)
})

it('turns a "do" into instructions', () => {
  expect(
    toInstructions(
      parse(`
        1
        2
      `)
    )
  ).toMatchInlineSnapshot(`
    push 1
    push 2
    do 2
  `)
})

it('evaluates recursive calls', () => {
  expect(
    toInstructions(
      parse(`
        1
        (do 2)
        (do (do 3) 4)
      `)
    )
  ).toMatchInlineSnapshot(`
    push 1
    push do
    push 2
    call 1
    push do
    push do
    push 3
    call 1
    push 4
    call 2
    do 3
  `)
})

it('evaluates lists', () => {
  expect(toInstructions(parse('[1 2]'))).toMatchInlineSnapshot(`
    push 1
    push 2
    list 2
    do 1
  `)
})

import assert from 'assert'
import { createProgram, advance } from './lib/core.js'

// Trampoline the program forward and log some stuff
const advanceAll = (program) => {
  let execLimit = 100

  let yielded, state
  while (true) {
    ([yielded, state] = advance(program, state))
    if (yielded) console.log({ yielded })
    if (state == null) return yielded

    if (execLimit-- <= 0) throw new Error('infinite loop?')
  }
}

console.log(' -----------  1  --------------')
assert.equal(
  advanceAll(createProgram`
    123
    456
  `),
  456
)

console.log(' -----------  2  --------------')
assert.equal(
  advanceAll(createProgram`
    (fn hello [] "world")
    (hello)
  `),
  "world"
)

console.log(' -----------  3  --------------')
assert.equal(
  advanceAll(createProgram`
    1 (do 2 (do (do 3 4) 5) 6)
  `),
  6
)

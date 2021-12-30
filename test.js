const { createProgram } = require('.')

// Trampoline the program forward and log some stuff
const advanceAll = (advance) => {
  let execLimit = 100

  let yielded, state
  while (true) {
    ([yielded, state] = advance(state))
    if (yielded) console.log({ yielded })
    if (state == null) return yielded

    if (execLimit-- <= 0) throw new Error('infinite loop?')
  }
}

console.log(' -----------  1  --------------')
advanceAll(createProgram`
  123
  456
`)

console.log(' -----------  2  --------------')
advanceAll(createProgram`
  (fn hello [] "world")
  (hello)
`)

console.log(' -----------  3  --------------')
advanceAll(createProgram`
  1 (do 2 (do (do 3 4) 5) 6)
`)

// An example of basic label usage.

const ansi = require('../util/ansi')
const Label = require('../ui/Label')

const label1 = new Label('Hello, world!')
const label2 = new Label('I love labels.')

label1.x = 3
label1.y = 2

label2.x = label1.x
label2.y = label1.y + 1

process.stdout.write(ansi.clearScreen())
label1.drawTo(process.stdout)
label2.drawTo(process.stdout)

process.stdin.once('data', () => {
  process.stdout.write(ansi.clearScreen())
  process.exit(0)
})

const ansi = require('../util/ansi')
const Root = require('../ui/Root')
const CommandLineInterfacer = require('../util/CommandLineInterfacer')
const ListScrollForm = require('../ui/form/ListScrollForm')
const Button = require('../ui/form/Button')

const interfacer = new CommandLineInterfacer()

interfacer.getScreenSize().then(size => {
  const root = new Root(interfacer)
  root.w = size.width
  root.h = size.height

  const list = new ListScrollForm()
  root.addChild(list)

  list.x = 2
  list.y = 2
  list.w = root.contentW - 4
  list.h = root.contentH - 4

  for (const item of ['Foo', 'Bar', 'Baz']) {
    const button = new Button(item)
    list.addInput(button)

    button.on('pressed', () => {
      process.stdout.write(ansi.cleanCursor())
      process.stdout.write(ansi.clearScreen())
      console.log(item)
      process.exit(0)
    })

    button.fixLayout()
  }

  list.fixLayout()

  root.select(list)

  setInterval(() => root.render(), 100)
}).catch(error => {
  console.error(error)
  process.exit(1)
})

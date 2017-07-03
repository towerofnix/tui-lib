const Root = require('../ui/Root')
const CommandLineInterfacer = require('../util/CommandLineInterfacer')
const AppElement = require('./basic-app')

const interfacer = new CommandLineInterfacer()

interfacer.getScreenSize().then(size => {
  const root = new Root(interfacer)
  root.w = size.width
  root.h = size.height

  const appElement = new AppElement()
  root.addChild(appElement)
  root.select(appElement)

  appElement.on('quitRequested', () => {
    process.exit(0)
  })

  setInterval(() => root.render(), 100)
}).catch(error => {
  console.error(error)
  process.exit(1)
})

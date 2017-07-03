// Telnet demo:
// - Basic telnet socket handling using the TelnetInterfacer
// - Handling client's screen size
// - Handling socket being closed by client
// - Handling cleanly closing the socket by hand

const net = require('net')
const Root = require('../ui/Root')
const TelnetInterfacer = require('../TelnetInterfacer')
const AppElement = require('./basic-app')

const server = new net.Server(socket => {
  const interfacer = new TelnetInterfacer(socket)

  interfacer.getScreenSize().then(size => {
    const root = new Root(interfacer)
    root.w = size.width
    root.h = size.height

    interfacer.on('screenSizeUpdated', newSize => {
      root.w = newSize.width
      root.h = newSize.height
      root.fixAllLayout()
    })

    const appElement = new AppElement()
    root.addChild(appElement)
    root.select(appElement)

    let closed = false

    appElement.on('quitRequested', () => {
      if (!closed) {
        interfacer.cleanTelnetOptions()
        socket.write('Goodbye!\n')
        socket.end()
        clearInterval(interval)
        closed = true
      }
    })

    socket.on('close', () => {
      if (!closed) {
        clearInterval(interval)
        closed = true
      }
    })

    const interval = setInterval(() => root.render(), 100)
  }).catch(error => {
    console.error(error)
    process.exit(1)
  })
})

server.listen(8008)

const iac = require('iac')

const ansi = require('../ansi')

const DisplayElement = require('./DisplayElement')

const FocusElement = require('./form/FocusElement')

module.exports = class Root extends DisplayElement {
  // An element to be used as the root of a UI. Handles lots of UI and
  // socket stuff.

  constructor(socket) {
    super()

    this.socket = socket
    this.initTelnetOptions()

    this.selected = null

    this.cursorBlinkOffset = Date.now()

    socket.on('data', buf => this.handleData(buf))
  }

  initTelnetOptions() {
    // Initializes various socket options, using telnet magic.

    // Disables linemode.
    this.socket.write(Buffer.from([
      255, 253, 34,  // IAC DO LINEMODE
      255, 250, 34, 1, 0, 255, 240,  // IAC SB LINEMODE MODE 0 IAC SE
      255, 251, 1    // IAC WILL ECHO
    ]))

    // Will SGA. Helps with putty apparently.
    this.socket.write(Buffer.from([
      255, 251, 3  // IAC WILL SGA
    ]))

    this.socket.write(ansi.hideCursor())
  }

  cleanTelnetOptions() {
    // Resets the telnet options and magic set in initTelnetOptions.

    this.socket.write(ansi.resetAttributes())
    this.socket.write(ansi.showCursor())
  }

  requestTelnetWindowSize() {
    // See RFC #1073 - Telnet Window Size Option

    return new Promise((res, rej) => {
      this.socket.write(Buffer.from([
        255, 253, 31  // IAC WILL NAWS
      ]))

      this.once('telnetsub', function until(sub) {
        if (sub[0] !== 31) { // NAWS
          this.once('telnetsub', until)
        } else {
          res({lines: sub[4], cols: sub[2]})
        }
      })
    })
  }

  handleData(buffer) {
    if (buffer[0] === 255) {
      // Telnet IAC (Is A Command) - ignore

      // Split the data into multiple IAC commands if more than one IAC was
      // sent.
      const values = Array.from(buffer.values())
      const commands = []
      const curCmd = [255]
      for (let value of values) {
        if (value === 255) { // IAC
          commands.push(Array.from(curCmd))
          curCmd.splice(1, curCmd.length)
          continue
        }
        curCmd.push(value)
      }
      commands.push(curCmd)

      for (let command of commands) {
        this.interpretTelnetCommand(command)
      }

      return
    }

    if (this.selected) {
      const els = this.selected.directAncestors.concat([this.selected])
      for (let el of els) {
        if (el instanceof FocusElement) {
          const shouldBreak = (el.keyPressed(buffer) === false)
          if (shouldBreak) {
            break
          }
          el.emit('keypressed', buffer)
        }
      }
    }
  }

  interpretTelnetCommand(command) {
    if (command[0] !== 255) { // IAC
      // First byte isn't IAC, which means this isn't a command, so do
      // nothing.
      return
    }

    if (command[1] === 251) { // WILL
      // Do nothing because I'm lazy
      const willWhat = command[2]
      //console.log('IAC WILL ' + willWhat)
    }

    if (command[1] === 250) { // SB
      this.telnetSub = command.slice(2)
    }

    if (command[1] === 240) { // SE
      this.emit('telnetsub', this.telnetSub)
      this.telnetSub = null
    }
  }

  drawTo(writable) {
    writable.write(ansi.moveCursor(0, 0))
    writable.write(' '.repeat(this.w * this.h))
  }

  didRenderTo(writable) {
    // Render the cursor, based on the cursorX and cursorY of the currently
    // selected element.
    if (
      this.selected &&
      typeof this.selected.cursorX === 'number' &&
      typeof this.selected.cursorY === 'number' &&
      (Date.now() - this.cursorBlinkOffset) % 1000 < 500
    ) {
      writable.write(ansi.moveCursor(
        this.selected.absCursorY, this.selected.absCursorX))
      writable.write(ansi.invert())
      writable.write('I')
      writable.write(ansi.resetAttributes())
    }
    writable.write(ansi.moveCursor(0, 0))
  }

  cursorMoved() {
    // Resets the blinking animation for the cursor. Call this whenever you
    // move the cursor.

    this.cursorBlinkOffset = Date.now()
  }

  select(el) {
    // Select an element. Calls the unfocus method on the already-selected
    // element, if there is one.

    if (this.selected) {
      this.selected.unfocus()
    }

    this.selected = el
    this.selected.focus()

    this.cursorMoved()
  }
}

const ansi = require('./ansi')
const waitForData = require('./waitForData')
const EventEmitter = require('events')

module.exports = class TelnetInterfacer extends EventEmitter {
  constructor(socket) {
    super()

    this.socket = socket

    socket.on('data', buffer => {
      if (buffer[0] === 255) {
        this.handleTelnetData(buffer)
      } else {
        this.emit('inputData', buffer)
      }
    })

    this.initTelnetOptions()
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

  async getScreenSize() {
    this.socket.write(Buffer.from([255, 253, 31])) // IAC DO NAWS

    let didWillNAWS = false
    let didSBNAWS = false
    let sb

    inputLoop: while (true) {
      const data = await waitForData(this.socket)

      for (let command of this.parseTelnetCommands(data)) {
        // WILL NAWS
        if (command[1] === 251 && command[2] === 31) {
          didWillNAWS = true
          continue
        }

        // SB NAWS
        if (didWillNAWS && command[1] === 250 && command[2] === 31) {
          didSBNAWS = true
          sb = command.slice(3)
          continue
        }

        // SE
        if (didSBNAWS && command[1] === 240) { // SE
          break inputLoop
        }
      }
    }

    return this.parseSBNAWS(sb)
  }

  parseTelnetCommands(buffer) {
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

      return commands
    } else {
      return []
    }
  }

  write(data) {
    this.socket.write(data)
  }

  handleTelnetData(buffer) {
    let didSBNAWS = false
    let sbNAWS

    for (let command of this.parseTelnetCommands(buffer)) {
      // SB NAWS
      if (command[1] === 250 && command[2] === 31) {
        didSBNAWS = true
        sbNAWS = command.slice(3)
        continue
      }

      // SE
      if (didSBNAWS && command[1] === 240) { // SE
        didSBNAWS = false
        this.emit('screenSizeUpdated', this.parseSBNAWS(sbNAWS))
        continue
      }
    }
  }

  parseSBNAWS(sb) {
    const cols = (sb[0] << 8) + sb[1]
    const lines = (sb[2] << 8) + sb[3]

    return { cols, lines, width: cols, height: lines }
  }
}

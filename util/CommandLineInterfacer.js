const EventEmitter = require('events')
const waitForData = require('./waitForData')
const ansi = require('./ansi')

module.exports = class CommandLineInterfacer extends EventEmitter {
  constructor(inStream = process.stdin, outStream = process.stdout) {
    super()

    this.inStream = inStream
    this.outStream = outStream

    inStream.on('data', buffer => {
      this.emit('inputData', buffer)
    })

    inStream.setRawMode(true)
  }

  async getScreenSize() {
    const waitUntil = cond => waitForData(this.inStream, cond)

    // Get old cursor position..
    this.outStream.write(ansi.requestCursorPosition())
    const { options: oldCoords } = this.parseANSICommand(
      await waitUntil(buf => ansi.isANSICommand(buf, 82))
    )

    // Move far to the bottom right of the screen, then get cursor position..
    // (We could use moveCursor here, but the 0-index offset isn't really
    // relevant.)
    this.outStream.write(ansi.moveCursorRaw(9999, 9999))
    this.outStream.write(ansi.requestCursorPosition())
    const { options: sizeCoords } = this.parseANSICommand(
      await waitUntil(buf => ansi.isANSICommand(buf, 82))
    )

    // Restore to old cursor position.. (Using moveCursorRaw is actaully
    // necessary here, since we'll be passing the coordinates returned from
    // another ANSI command.)
    this.outStream.write(ansi.moveCursorRaw(oldCoords[0], oldCoords[1]))

    // And return dimensions.
    const [ sizeLine, sizeCol ] = sizeCoords
    return {
      lines: sizeLine, cols: sizeCol,
      width: sizeCol, height: sizeLine
    }
  }

  parseANSICommand(buffer) {
    // Typically ANSI commands are written ESC[1;2;3;4C
    // ..where ESC is the ANSI escape code, equal to hexadecimal 1B and
    //   decimal 33
    // ..where [ and ; are the literal strings "[" and ";"
    // ..where 1, 2, 3, and 4 are decimal integer arguments written in ASCII
    //   that may last more than one byte (e.g. "15")
    // ..where C is some number representing the code of the command

    if (buffer[0] !== 0x1b || buffer[1] !== 0x5b) {
      throw new Error('Not an ANSI command')
    }

    const options = []
    let curOption = ''
    let commandCode = null
    for (let val of buffer.slice(2)) {
      if (48 <= val && val <= 57) { // 0124356789
        curOption = curOption.concat(val - 48)
      } else {
        options.push(parseInt(curOption))
        curOption = ''

        if (val !== 59) { // ;
          commandCode = val
          break
        }
      }
    }

    return {code: commandCode, options: options}
  }

  write(data) {
    this.outStream.write(data)
  }
}

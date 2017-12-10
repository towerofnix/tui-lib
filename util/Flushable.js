const ansi = require('./ansi')

module.exports = class Flushable {
  // A writable that can be used to collect chunks of data before writing
  // them.

  constructor(writable, shouldCompress = false) {
    this.target = writable

    // Use the magical ANSI self-made compression method that probably
    // doesn't *quite* work but should drastically decrease write size?
    this.shouldCompress = shouldCompress

    // Whether or not to show compression statistics (original written size
    // and ANSI-interpreted compressed size) in the output of flush.
    this.shouldShowCompressionStatistics = false

    // Update these if you plan on using the ANSI compressor!
    this.screenLines = 24
    this.screenCols = 80

    this.ended = false
    this.paused = false
    this.requestedFlush = false

    this.chunks = []
  }

  write(what) {
    this.chunks.push(what)
  }

  flush() {
    // If we're paused, we don't want to write, but we will keep a note that a
    // flush was requested for when we unpause.
    if (this.paused) {
      this.requestedFlush = true
      return
    }

    // Don't write if we've ended.
    if (this.ended) {
      return
    }

    // End if the target is destroyed.
    // Yes, this relies on the target having a destroyed property
    // Don't worry, it'll still work if there is no destroyed property though
    // (I think)
    if (this.target.destroyed) {
      this.end()
      return
    }

    let toWrite = this.chunks.join('')

    if (this.shouldCompress) {
      toWrite = this.compress(toWrite)
    }

    try {
      this.target.write(toWrite)
    } catch(err) {
      console.error('Flushable write error (ending):', err.message)
      this.end()
    }

    this.chunks = []
  }

  pause() {
    this.paused = true
  }

  resume() {
    this.paused = false

    if (this.requestedFlush) {
      this.flush()
    }
  }

  end() {
    this.ended = true
  }

  compress(toWrite) {
    // TODO: customize screen size
    let { newChars, lastChar, screen } = ansi.interpret(
      toWrite, this.screenLines, this.screenCols,
      this.lastFrameChars, this.lastFrameLastChar
    )

    this.lastFrameChars = newChars
    this.lastFrameLastChar = lastChar

    if (this.shouldShowCompressionStatistics) {
      const pcSaved = Math.round(100 - (100 / toWrite.length * screen.length))
      screen += (
        '\x1b[H\x1b[0m(ANSI-interpret: ' +
        `${toWrite.length} -> ${screen.length} ${pcSaved}% saved)  `
      )
      this.lastFrameLastChar.attributes = []
    }

    return screen
  }
}

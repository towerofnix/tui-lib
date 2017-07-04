const ansi = require('../../util/ansi')
const telc = require('../../util/telchars')

const FocusElement = require('./FocusElement')

module.exports = class Button extends FocusElement {
  // A button.

  constructor(text) {
    super()

    this.text = text

    this.cursorX = null
    this.cursorY = null
  }

  fixLayout() {
    this.w = this.text.length
    this.h = 1
  }

  drawTo(writable) {
    if (this.isFocused) {
      writable.write(ansi.invert())
    }

    writable.write(ansi.moveCursor(this.absTop, this.absLeft))
    writable.write(this.text)

    writable.write(ansi.resetAttributes())

    super.drawTo(writable)
  }

  keyPressed(keyBuf) {
    if (telc.isSelect(keyBuf)) {
      this.emit('pressed')
    }
  }
}

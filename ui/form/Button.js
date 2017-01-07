const ansi = require('../../ansi')
const telc = require('../../telchars')

const FocusElement = require('./FocusElement')

module.exports = class ButtonInput extends FocusElement {
  // A button.

  constructor(text) {
    super()

    this.text = text

    this.cursorX = null
    this.cursorY = null
  }

  // Setting the text of the button should change the width of the button to
  // fit the text.
  //
  // TODO: Make this happen in fixLayout
  set text(newText) {
    this._text = newText
    this.w = newText.length
  }

  get text() {
    return this._text
  }

  drawTo(writable) {
    if (this.isSelected) {
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

const ansi = require('../ansi')

const DisplayElement = require('./DisplayElement')

module.exports = class Label extends DisplayElement {
  // A simple text display. Automatically adjusts size to fit text.

  constructor(text='') {
    super()

    this.text = text
    this.textAttributes = []
  }

  drawTo(writable) {
    if (this.textAttributes.length) {
      writable.write(ansi.setAttributes(this.textAttributes))
    }

    writable.write(ansi.moveCursor(this.absTop, this.absLeft))
    writable.write(this.text)

    if (this.textAttributes.length) {
      writable.write(ansi.resetAttributes())
    }

    super.drawTo(writable)
  }

  set text(newText) {
    this._text = newText

    this.w = newText.length
  }

  get text() {
    return this._text
  }
}

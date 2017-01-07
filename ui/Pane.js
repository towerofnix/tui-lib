const ansi = require('../ansi')
const unic = require('../unichars')

const DisplayElement = require('./DisplayElement')

const Label = require('./Label')

module.exports = class Pane extends DisplayElement {
  // A simple rectangular framed pane.

  constructor() {
    super()

    this.frameColor = null

    this.hPadding = 1
    this.vPadding = 1
  }

  drawTo(writable) {
    this.drawFrame(writable)
    super.drawTo(writable)
  }

  drawFrame(writable, debug=false) {
    writable.write(ansi.setForeground(this.frameColor))

    const left = this.absLeft
    const right = this.absRight
    const top = this.absTop
    const bottom = this.absBottom

    // Background
    // (TODO) Transparent background (that dimmed everything behind it) would
    // be cool at some point!
    for (let y = top + 1; y <= bottom - 1; y++) {
      writable.write(ansi.moveCursor(y, left))
      writable.write(' '.repeat(this.w))
    }

    // Left/right edges
    for (let x = left + 1; x <= right - 1; x++) {
      writable.write(ansi.moveCursor(top, x))
      writable.write(unic.BOX_H)
      writable.write(ansi.moveCursor(bottom, x))
      writable.write(unic.BOX_H)
    }

    // Top/bottom edges
    for (let y = top + 1; y <= bottom - 1; y++) {
      writable.write(ansi.moveCursor(y, left))
      writable.write(unic.BOX_V)
      writable.write(ansi.moveCursor(y, right))
      writable.write(unic.BOX_V)
    }

    // Corners
    writable.write(ansi.moveCursor(top, left))
    writable.write(unic.BOX_CORNER_TL)
    writable.write(ansi.moveCursor(top, right))
    writable.write(unic.BOX_CORNER_TR)
    writable.write(ansi.moveCursor(bottom, left))
    writable.write(unic.BOX_CORNER_BL)
    writable.write(ansi.moveCursor(bottom, right))
    writable.write(unic.BOX_CORNER_BR)

    // Debug info
    if (debug) {
      writable.write(ansi.moveCursor(6, 8))
      writable.write(
        `x: ${this.x}; y: ${this.y}; w: ${this.w}; h: ${this.h}`)
      writable.write(ansi.moveCursor(7, 8))
      writable.write(`AbsX: ${this.absX}; AbsY: ${this.absY}`)
      writable.write(ansi.moveCursor(8, 8))
      writable.write(`Left: ${this.left}; Right: ${this.right}`)
      writable.write(ansi.moveCursor(9, 8))
      writable.write(`Top: ${this.top}; Bottom: ${this.bottom}`)
    }

    writable.write(ansi.setForeground(ansi.C_RESET))
  }

  static alert(parent, text) {
    // Show an alert pane in the bottom left of the given parent element for
    // a couple seconds.

    const pane = new Pane()
    pane.frameColor = ansi.C_WHITE
    pane.w = text.length + 2
    pane.h = 3
    parent.addChild(pane)

    const label = new Label(text)
    label.textAttributes = [ansi.C_WHITE]
    pane.addChild(label)

    setTimeout(() => {
      parent.removeChild(pane)
    }, 2000)
  }
}

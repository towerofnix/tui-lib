const ansi = require('../../ansi')
const unic = require('../../unichars')
const telc = require('../../telchars')

const FocusElement = require('./FocusElement')

module.exports = class TextInput extends FocusElement {
  // An element that the user can type in.

  constructor() {
    super()

    this.value = ''
    this.cursorIndex = 0
    this.scrollChars = 0
  }

  drawTo(writable) {
    // There should be room for the cursor so move the "right edge" left a
    // single character.

    const startRange = this.scrollChars
    const endRange = this.scrollChars + this.w - 3

    let str = this.value.slice(startRange, endRange)

    writable.write(ansi.moveCursor(this.absTop, this.absLeft + 1))
    writable.write(str)

    // Ellipsis on left side, if there's more characters behind the visible
    // area.
    if (startRange > 0) {
      writable.write(ansi.moveCursor(this.absTop, this.absLeft))
      writable.write(unic.ELLIPSIS)
    }

    // Ellipsis on the right side, if there's more characters ahead of the
    // visible area.
    if (endRange < this.value.length) {
      writable.write(ansi.moveCursor(this.absTop, this.absRight - 1))
      writable.write(unic.ELLIPSIS.repeat(2))
    }

    this.cursorX = this.cursorIndex - this.scrollChars + 1

    super.drawTo(writable)
  }

  keyPressed(keyBuf) {
    if (keyBuf[0] === 127) {
      this.value = (
        this.value.slice(0, this.cursorIndex - 1) +
        this.value.slice(this.cursorIndex)
      )
      this.cursorIndex--
      this.root.cursorMoved()
    } else if (keyBuf[0] === 13) {
      this.emit('value', this.value)
    } else if (keyBuf[0] === 0x1b && keyBuf[1] === 0x5b) {
      // Keyboard navigation
      if (keyBuf[2] === 0x44) {
        this.cursorIndex--
        this.root.cursorMoved()
      } else if (keyBuf[2] === 0x43) {
        this.cursorIndex++
        this.root.cursorMoved()
      }
    } else if (telc.isEscape(keyBuf)) {
      // ESC is bad and we don't want that in the text input!
      return
    } else {
      // console.log(keyBuf, keyBuf[0], keyBuf[1], keyBuf[2])
      this.value = (
        this.value.slice(0, this.cursorIndex) + keyBuf.toString() +
        this.value.slice(this.cursorIndex)
      )
      this.cursorIndex++
      this.root.cursorMoved()
    }

    this.keepCursorInRange()
  }

  keepCursorInRange() {
    // Keep the cursor inside or at the end of the input value.

    if (this.cursorIndex < 0) {
      this.cursorIndex = 0
    }

    if (this.cursorIndex > this.value.length) {
      this.cursorIndex = this.value.length
    }

    // Scroll right, if the cursor is past the right edge of where text is
    // displayed.
    if (this.cursorIndex - this.scrollChars > this.w - 3) {
      this.scrollChars++
    }

    // Scroll left, if the cursor is behind the left edge of where text is
    // displayed.
    if (this.cursorIndex - this.scrollChars < 0) {
      this.scrollChars--
    }

    // Scroll left, if we can see past the end of the text.
    if (this.scrollChars > 0 && (
      this.scrollChars + this.w - 3 > this.value.length)
    ) {
      this.scrollChars--
    }
  }
}

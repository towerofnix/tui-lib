const iac = require('iac')

const ansi = require('../util/ansi')

const DisplayElement = require('./DisplayElement')

const FocusElement = require('./form/FocusElement')

module.exports = class Root extends DisplayElement {
  // An element to be used as the root of a UI. Handles lots of UI and
  // socket stuff.

  constructor(interfacer) {
    super()

    this.interfacer = interfacer

    this.selected = null

    this.cursorBlinkOffset = Date.now()

    interfacer.on('inputData', buf => this.handleData(buf))
  }

  render() {
    this.renderTo(this.interfacer)
  }

  handleData(buffer) {
    if (this.selected) {
      const els = this.selected.directAncestors.concat([this.selected])
      for (const el of els) {
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

  drawTo(writable) {
    writable.write(ansi.moveCursor(0, 0))
    writable.write(' '.repeat(this.w * this.h))
  }

  didRenderTo(writable) {
    // Render the cursor, based on the cursorX and cursorY of the currently
    // selected element.
    if (this.selected && this.selected.cursorVisible) {
      if ((Date.now() - this.cursorBlinkOffset) % 1000 < 500) {
        writable.write(
          ansi.moveCursor(this.selected.absCursorY, this.selected.absCursorX)
        )
        writable.write(ansi.invert())
        writable.write('I')
        writable.write(ansi.resetAttributes())
      }

      writable.write(ansi.showCursor())
      writable.write(
        ansi.moveCursor(this.selected.absCursorY, this.selected.absCursorX)
      )
    } else {
      writable.write(ansi.hideCursor())
    }

    if (this.selected && this.selected.cursorVisible) {}
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
      this.selected.unfocused()
    }

    this.selected = el
    this.selected.focused()

    this.cursorMoved()
  }

  isChildOrSelfSelected(el) {
    if (!this.selected) return false
    if (this.selected === el) return true
    if (this.selected.directAncestors.includes(el)) return true
    return false
  }
}

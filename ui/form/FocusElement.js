const DisplayElement = require('../DisplayElement')

module.exports = class FocusElement extends DisplayElement {
  // A basic element that can receive cursor focus.

  constructor() {
    super()

    this.cursorVisible = false
    this.cursorX = 0
    this.cursorY = 0

    this.isFocused = false
  }

  focused() {
    // Should be overridden in subclasses.

    this.isFocused = true
  }

  unfocused() {
    // Should be overridden in subclasses.

    this.isFocused = false
  }

  get selectable() {
    // Should be overridden if you want to make the element unselectable
    // (according to particular conditions).

    return true
  }

  keyPressed(keyBuf) {
    // Do something with a buffer containing the key pressed (that is,
    // telnet data sent). Should be overridden in subclasses.
    //
    // Arrow keys are sent as a buffer in the form of
    // ESC[# where # is A, B, C or D. See more here:
    // http://stackoverflow.com/a/11432632/4633828
  }

  get absCursorX() { return this.absX + this.cursorX }
  get absCursorY() { return this.absY + this.cursorY }
}

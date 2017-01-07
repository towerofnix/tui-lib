const DisplayElement = require('../DisplayElement')

module.exports = class FocusElement extends DisplayElement {
  // A basic element that can receive cursor focus.

  constructor() {
    super()

    this.cursorX = 0
    this.cursorY = 0

    this.isSelected = false
  }

  focus(socket) {
    // Do something with socket. Should be overridden in subclasses.

    this.isSelected = true
  }

  unfocus() {
    // Should be overridden in subclasses.

    this.isSelected = false
  }

  keyPressed(keyBuf) {
    // Do something with a buffer containing the key pressed (that is,
    // telnet data sent). Should be overridden in subclasses.
    //
    // Keyboard characters are sent as a buffer in the form of
    // ESC[# where # is A, B, C or D. See more here:
    // http://stackoverflow.com/a/11432632/4633828
  }

  get absCursorX() { return this.absX + this.cursorX }
  get absCursorY() { return this.absY + this.cursorY }
}

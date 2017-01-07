const ansi = require('../../ansi')

const FocusElement = require('./FocusElement')

module.exports = class FocusBox extends FocusElement {
  // A box (not to be confused with Pane!) that can be selected. When it's
  // selected, it applies an invert effect to its children. (This won't work
  // well if you have elements inside of it that have their own attributes,
  // since they're likely to reset all effects after drawing - including the
  // invert from the FocusBox! Bad ANSI limitations; it's relatively likely
  // I'll implement maaaaaagic to help deal with this - maybe something
  // similar to 'pushMatrix' from Processing - at some point... [TODO])

  constructor() {
    super()

    this.cursorX = null
    this.cursorY = null
  }

  drawTo(writable) {
    if (this.isSelected) {
      writable.write(ansi.invert())
    }
  }

  didRenderTo(writable) {
    if (this.isSelected) {
      writable.write(ansi.resetAttributes())
    }
  }
}

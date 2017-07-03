// Basic app demo:
// - Structuring a basic element tree
// - Creating a pane and text input
// - Using content width/height to layout elements
// - Subclassing a FocusElement and using its focused method
// - Sending a quit-app request via Control-C
//
// This script cannot actually be used on its own; see the examples on
// interfacers (interfacer-command-line.js and inerfacer-telnet.js) for a
// working demo.

const Pane = require('../ui/Pane')
const FocusElement = require('../ui/form/FocusElement')
const TextInput = require('../ui/form/TextInput')

module.exports = class AppElement extends FocusElement {
  constructor() {
    super()

    this.pane = new Pane()
    this.addChild(this.pane)

    this.textInput = new TextInput()
    this.pane.addChild(this.textInput)
  }

  fixLayout() {
    this.w = this.parent.contentW
    this.h = this.parent.contentH

    this.pane.w = this.contentW
    this.pane.h = this.contentH

    this.textInput.x = 4
    this.textInput.y = 2
    this.textInput.w = this.pane.contentW - 8
  }

  focused() {
    this.root.select(this.textInput)
  }

  keyPressed(keyBuf) {
    if (keyBuf[0] === 0x03) { // 0x03 is Control-C
      this.emit('quitRequested')
      return 
    }

    super.keyPressed(keyBuf)
  }
}

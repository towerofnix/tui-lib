const telc = require('../../util/telchars')

const FocusElement = require('./FocusElement')

module.exports = class Form extends FocusElement {
  constructor() {
    super()

    this.inputs = []
    this.curIndex = 0
  }

  addInput(input, asChild = true) {
    // Adds the given input as a child element and pushes it to the input
    // list. If the second optional, asChild, is false, it won't add the
    // input element as a child of the form.

    this.inputs.push(input)

    if (asChild) {
      this.addChild(input)
    }
  }

  keyPressed(keyBuf) {
    if (telc.isTab(keyBuf) || telc.isBackTab(keyBuf)) {
      // No inputs to tab through, so do nothing.
      if (this.inputs.length < 2) {
        return
      }

      if (telc.isTab(keyBuf)) {
        this.nextInput()
      } else {
        this.previousInput()
      }

      return false
    }
  }

  updateSelectedElement() {
    this.root.select(this.inputs[this.curIndex])
  }

  previousInput() {
    this.curIndex = (this.curIndex - 1)
    if (this.curIndex < 0) {
      this.curIndex = (this.inputs.length - 1)
    }

    this.updateSelectedElement()
  }

  nextInput() {
    this.curIndex = (this.curIndex + 1) % this.inputs.length

    this.updateSelectedElement()
  }
  
  focused() {
    this.root.select(this.inputs[this.curIndex])
  }
}

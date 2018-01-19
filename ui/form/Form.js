const telc = require('../../util/telchars')

const FocusElement = require('./FocusElement')

module.exports = class Form extends FocusElement {
  constructor() {
    super()

    this.inputs = []
    this.curIndex = 0
    this.captureTab = true
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

  removeInput(input, asChild = true) {
    // Removes the given input from the form's input list. If the optional
    // argument asChild is false, it won't try to removeChild the input.

    if (this.inputs.includes(input)) {
      this.inputs.splice(this.inputs.indexOf(input), 1)

      if (asChild) {
        this.removeChild(input)
      }
    }
  }

  keyPressed(keyBuf) {
    // Don't do anything if captureTab is set to false. This is handy for
    // nested forms.
    if (!this.captureTab) {
      return
    }

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
    if (this.root.select) {
      this.root.select(this.inputs[this.curIndex])
    }
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

  firstInput(selectForm = true) {
    this.curIndex = 0

    if (selectForm || (
      this.root.isChildOrSelfSelected && this.root.isChildOrSelfSelected(this)
    )) {
      this.updateSelectedElement()
    }
  }

  focused() {
    this.updateSelectedElement()
  }
}

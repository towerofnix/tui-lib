const telc = require('../../telchars')

const FocusElement = require('./FocusElement')

const Button = require('./Button')
const Form = require('./Form')
const Label = require('../Label')
const Pane = require('../Pane')

module.exports = class ConfirmDialog extends FocusElement {
  // A basic cancel dialog. Has one buttons, cancel, and a label.
  // The escape (esc) key can be used to exit the dialog (which sends a
  // 'cancelled' event, as the cancel button also does).

  constructor(text) {
    super()

    this.pane = new Pane()
    this.addChild(this.pane)

    this.cancelBtn = new Button('Cancel')
    this.pane.addChild(this.cancelBtn)

    this.label = new Label(text)
    this.pane.addChild(this.label)

    this.initEventListeners()
  }

  initEventListeners() {
    this.cancelBtn.on('pressed', () => this.cancelPressed())
  }

  fixLayout() {
    this.w = this.parent.contentW
    this.h = this.parent.contentH

    this.pane.w = Math.max(40, 4 + this.label.w)
    this.pane.h = 7
    this.pane.centerInParent()

    this.label.x = Math.floor((this.pane.contentW - this.label.w) / 2)
    this.label.y = 1

    this.cancelBtn.x = Math.floor(
      (this.pane.contentW - this.cancelBtn.w) / 2)
    this.cancelBtn.y = this.pane.contentH - 2
  }

  focus() {
    this.root.select(this.cancelBtn)
  }

  keyPressed(keyBuf) {
    if (telc.isCancel(keyBuf)) {
      this.emit('cancelled')
    }
  }

  cancelPressed() {
    this.emit('cancelled')
  }
}

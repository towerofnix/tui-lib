const telc = require('../../telchars')

const FocusElement = require('./FocusElement')

const Button = require('./Button')
const Form = require('./Form')
const Label = require('../Label')
const Pane = require('../Pane')

module.exports = class ConfirmDialog extends FocusElement {
  // A basic yes/no dialog. Has two buttons, confirm/cancel, and a label.
  // The escape (esc) key can be used to exit the dialog (which sends a
  // 'cancelled' event, as the cancel button also does).

  constructor(text) {
    super()

    this.pane = new Pane()
    this.addChild(this.pane)

    this.form = new Form()
    this.pane.addChild(this.form)

    this.confirmBtn = new Button('Confirm')
    this.form.addInput(this.confirmBtn)

    this.cancelBtn = new Button('Cancel')
    this.form.addInput(this.cancelBtn)

    this.label = new Label(text)
    this.form.addChild(this.label)

    this.initEventListeners()
  }

  initEventListeners() {
    this.confirmBtn.on('pressed', () => this.confirmPressed())
    this.cancelBtn.on('pressed', () => this.cancelPressed())
  }

  fixLayout() {
    this.w = this.parent.contentW
    this.h = this.parent.contentH

    this.pane.w = Math.max(40, 2 + this.label.w)
    this.pane.h = 7
    this.pane.centerInParent()

    this.form.w = this.pane.contentW
    this.form.h = this.pane.contentH

    this.label.x = Math.floor((this.form.contentW - this.label.w) / 2)
    this.label.y = 1

    this.confirmBtn.x = 1
    this.confirmBtn.y = this.form.contentH - 2

    this.cancelBtn.x = this.form.right - this.cancelBtn.w - 1
    this.cancelBtn.y = this.form.contentH - 2
  }

  focus() {
    this.root.select(this.form)
  }

  keyPressed(keyBuf) {
    if (telc.isCancel(keyBuf)) {
      this.emit('cancelled')
    }
  }

  confirmPressed() {
    this.emit('confirmed')
  }

  cancelPressed() {
    this.emit('cancelled')
  }
}

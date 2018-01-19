const path = require('path')

const Button = require('../form/Button')
const Dialog = require('../Dialog')
const FilePickerForm = require('./FilePickerForm')
const Form = require('../form/Form')
const Label = require('../Label')
const TextInput = require('../form/TextInput')

module.exports = class OpenFileDialog extends Dialog {
  constructor() {
    super()

    this.visible = false

    this.form = new Form()
    this.pane.addChild(this.form)

    this.filePathLabel = new Label('Enter file path:')
    this.filePathInput = new TextInput()
    this.openButton = new Button('Open')
    this.cancelButton = new Button('Cancel')

    this.filePickerForm = new FilePickerForm()
    this.filePickerForm.captureTab = false

    this.form.addChild(this.filePathLabel)
    this.form.addInput(this.filePathInput)
    this.form.addInput(this.filePickerForm)
    this.form.addInput(this.openButton)
    this.form.addInput(this.cancelButton)

    this._resolve = null

    this.openButton.on('pressed', () => {
      this._resolve(this.filePathInput.value)
    })

    this.filePathInput.on('value', () => {
      this._resolve(this.filePathInput.value)
    })

    {
      const cb = append => p => {
        this.filePathInput.setValue((path.relative(__dirname, p) || '.') + append)
      }

      this.filePickerForm.on('selected', cb(''))
      this.filePickerForm.on('browsingDirectory', cb('/'))
    }

    this.cancelButton.on('pressed', () => {
      this._resolve(null)
    })

    const dir = (this.lastFilePath
      ? path.relative(__dirname, path.dirname(this.lastFilePath)) + '/'
      : './')

    this.filePathInput.setValue(dir)
    this.filePickerForm.fillItems(dir)
  }

  fixLayout() {
    super.fixLayout()

    this.pane.w = Math.min(this.contentW, 40)
    this.pane.h = Math.min(this.contentH, 20)
    this.pane.centerInParent()

    this.form.w = this.pane.contentW
    this.form.h = this.pane.contentH

    this.filePathLabel.x = 0
    this.filePathLabel.y = 0

    this.filePathInput.x = this.filePathLabel.right + 2
    this.filePathInput.y = this.filePathLabel.y
    this.filePathInput.w = this.form.contentW - this.filePathInput.x

    this.filePickerForm.x = 0
    this.filePickerForm.y = this.filePathInput.y + 2
    this.filePickerForm.w = this.form.contentW
    this.filePickerForm.h = this.form.contentH - this.filePickerForm.y - 2

    this.openButton.x = 0
    this.openButton.y = this.form.contentH - 1

    this.cancelButton.x = this.openButton.right + 2
    this.cancelButton.y = this.openButton.y
  }

  focused() {
    this.form.firstInput()
  }

  go() {
    this.visible = true
    this.root.select(this)

    return new Promise(resolve => {
      this._resolve = resolve
    }).then(filePath => {
      this.visible = false
      this.lastFilePath = filePath
      return filePath
    })
  }
}


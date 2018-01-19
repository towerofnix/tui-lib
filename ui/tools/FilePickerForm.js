const fs = require('fs')
const util = require('util')
const path = require('path')

const readdir = util.promisify(fs.readdir)
const stat = util.promisify(fs.stat)
const naturalSort = require('node-natural-sort')

const Button = require('../form/Button')
const ListScrollForm = require('../form/ListScrollForm')

module.exports = class FilePickerForm extends ListScrollForm {
  fillItems(dirPath) {
    this.inputs = []
    this.children = []

    const button = new Button('..Loading..')
    this.addInput(button)
    this.firstInput(false)

    readdir(dirPath).then(
      async items => {
        this.removeInput(button)

        const processedItems = await Promise.all(items.map(item => {
          const itemPath = path.resolve(dirPath, item)
          return stat(itemPath).then(s => {
            return {
              path: itemPath,
              label: item + (s.isDirectory() ? '/' : ''),
              isDirectory: s.isDirectory()
            }
          })
        }))

        const sort = naturalSort({
          properties: {
            caseSensitive: false
          }
        })
        processedItems.sort((a, b) => {
          if (a.isDirectory === b.isDirectory) {
            return sort(a.label, b.label)
          } else {
            if (a.isDirectory) {
              return -1
            } else {
              return +1
            }
          }
        })

        processedItems.unshift({
          path: path.resolve(dirPath, '..'),
          label: '../',
          isDirectory: true
        })

        let y = 0
        for (const item of processedItems) {
          const itemButton = new Button(item.label)
          itemButton.y = y
          y++
          this.addInput(itemButton)

          itemButton.on('pressed', () => {
            if (item.isDirectory) {
              this.emit('browsingDirectory', item.path)
              this.fillItems(item.path)
            } else {
              this.emit('selected', item.path)
            }
          })
        }

        console.log('HALLO.', false)
        this.firstInput(false)
        this.fixLayout()
      },
      () => {
        button.text = 'Failed to read path! (Cancel)'
        button.on('pressed', () => {
          this.emit('canceled')
        })
      })
  }
}


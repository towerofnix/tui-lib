const DisplayElement = require('./DisplayElement')

module.exports = class HorizontalBox extends DisplayElement {
  // A box that will automatically lay out its children in a horizontal row.

  fixLayout() {
    let nextX = 0
    for (let child of this.children) {
      child.x = nextX
      nextX = child.right + 1
    }
  }
}

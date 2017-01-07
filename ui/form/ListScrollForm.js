const Form = require('./Form')

module.exports = class ListScrollForm extends Form {
  // A form that lets the user scroll through a list of items. It
  // automatically adjusts to always allow the selected item to be visible.

  constructor(layoutType = 'vertical') {
    super()

    this.layoutType = layoutType

    this.scrollItems = 0
  }

  fixLayout() {
    // The scrollItems property represents the item to the very left of where
    // we've scrolled, so we know right away that none of those will be
    // visible and we won't bother iterating over them.
    const itemsPastScroll = this.inputs.slice(this.scrollItems)

    // This variable stores how far along the respective axis (as defined by
    // posProp) the next element should be.
    let nextPos = 0

    for (let item of itemsPastScroll) {
      item[this.posProp] = nextPos
      nextPos += item[this.sizeProp]

      // By default, the item should be visible..
      item.visible = true

      // ..but the item's far edge is past the form's far edge, it isn't
      // fully visible and should be hidden.
      if (item[this.posProp] + item[this.sizeProp] > this.formEdge) {
        item.visible = false
      }

      // Same deal goes for the close edge. We can check it against 0 since
      // the close edge of the form's content is going to be 0, of course!
      if (item[this.posProp] < 0) {
        item.visible = false
      }
    }
  }

  keyPressed(keyBuf) {
    super.keyPressed(keyBuf)

    const sel = this.inputs[this.curIndex]

    // If the item is ahead of our view (either to the right of or below),
    // we should move the view so that the item is the farthest right (of all
    // the visible items).
    if (this.getItemPos(sel) > this.formEdge + this.scrollSize) {
      // We can decide how many items to scroll past by moving forward until
      // our item's far edge is visible.

      let i
      let edge = this.formEdge

      for (i = 0; i < this.inputs.length; i++) {
        if (this.getItemPos(sel) <= edge) break
        edge += this.inputs[i][this.sizeProp]
      }

      // Now that we have the right index to scroll to, apply it!
      this.scrollItems = i
    }

    // Adjusting the number of scroll items is much simpler to deal with if
    // the item is behind our view. Since the item's behind, we need to move
    // the scroll to be immediately behind it, which is simple since we
    // already have its index.
    if (this.getItemPos(sel) <= this.scrollSize) {
      this.scrollItems = this.curIndex
    }

    this.fixLayout()
  }

  getItemPos(item) {
    // Gets the position of the item in an unscrolled view.

    return this.inputs.slice(0, this.inputs.indexOf(item) + 1)
      .reduce((a, b) => a + b[this.sizeProp], 0)
  }

  get sizeProp() {
    // The property used to measure the size of an item. If the layoutType
    // isn't valid (that is, 'horizontal' or 'vertical'), it'll return null.

    return (
      this.layoutType === 'horizontal' ? 'w' :
      this.layoutType === 'vertical' ? 'h' :
      null
    )
  }

  get posProp() {
    // The property used to position an item. Like sizeProp, returns null if
    // the layoutType isn't valid.

    return (
      this.layoutType === 'horizontal' ? 'x' :
      this.layoutType === 'vertical' ? 'y' :
      null)
  }

  get edgeProp() {
    // The property used to get the far edge of the property. As with
    // sizeProp, if the layoutType doesn't have an expected value, it'll
    // return null.

    return (
      this.layoutType === 'horizontal' ? 'right' :
      this.layoutType === 'vertical' ? 'bottom' :
      null)
  }

  get formEdge() {
    // Returns the value of the far edge of this form. Items farther in the
    // list (up to the edge) will be closer to this edge.

    return (
      this.layoutType === 'horizontal' ? this.contentW :
      this.layoutType === 'vertical' ? this.contentH :
      null)
  }

  get scrollSize() {
    // Gets the actual length made up by all of the items currently scrolled
    // past.

    return this.inputs.slice(0, this.scrollItems)
      .reduce((a, b) => a + b[this.sizeProp], 0)
  }
}

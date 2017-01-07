const EventEmitter = require('events')
const exception = require('../exception')

module.exports = class DisplayElement extends EventEmitter {
  // A general class that handles dealing with screen coordinates, the tree
  // of elements, and other common stuff.
  //
  // This element doesn't handle any real rendering; just layouts. Placing
  // characters at specific positions should be implemented in subclasses.
  //
  // It's a subclass of EventEmitter, so you can make your own events within
  // the logic of your subclass.

  constructor() {
    super()

    this.visible = true

    this.parent = null
    this.children = []

    this.x = 0
    this.y = 0
    this.w = 0
    this.h = 0

    this.hPadding = 0
    this.vPadding = 0
  }

  drawTo(writable) {
    // Writes text to a "writable" - an object that has a "write" method.
    // Custom rendering should be handled as an override of this method in
    // subclasses of DisplayElement.
  }

  renderTo(writable) {
    // Like drawTo, but only calls drawTo if the element is visible. Use this
    // with your root element, not drawTo.

    if (this.visible) {
      this.drawTo(writable)
      this.drawChildrenTo(writable)
      this.didRenderTo(writable)
    }
  }

  didRenderTo(writable) {
    // Called immediately after rendering this element AND all of its
    // children. If you need to do something when that happens, override this
    // method in your subclass.
    //
    // It's fine to draw more things to the writable here - just keep in mind
    // that it'll be drawn over this element and its children, but not any
    // elements drawn in the future.
  }

  fixLayout() {
    // Adjusts the layout of children in this element. If your subclass has
    // any children in it, you should override this method.
  }

  fixAllLayout() {
    // Runs fixLayout on this as well as all children.

    this.fixLayout()
    for (let child of this.children) {
      child.fixAllLayout()
    }
  }

  drawChildrenTo(writable) {
    // Draws all of the children to a writable.

    for (let child of this.children) {
      child.renderTo(writable)
    }
  }

  addChild(child) {
    // TODO Don't let a direct ancestor of this be added as a child. Don't
    // let itself be one of its childs either!

    if (child === this) {
      throw exception(
        'EINVALIDHIERARCHY', 'An element cannot be a child of itself')
    }

    child.parent = this
    this.children.push(child)
    child.fixLayout()
  }

  removeChild(child) {
    // Removes the given child element from the children list of this
    // element. It won't be rendered in the future. If the given element
    // isn't a direct child of this element, nothing will happen.

    if (child.parent !== this) {
      return
    }

    child.parent = null
    this.children.splice(this.children.indexOf(child), 1)
    this.fixLayout()
  }

  centerInParent() {
    // Utility function to center this element in its parent. Must be called
    // only when it has a parent. Set the width and height of the element
    // before centering it!

    if (this.parent === null) {
      throw new Error('Cannot center in parent when parent is null')
    }

    this.x = Math.round((this.parent.contentW - this.w) / 2)
    this.y = Math.round((this.parent.contentH - this.h) / 2)
  }

  get root() {
    let el = this
    while (el.parent) {
      el = el.parent
    }
    return el
  }

  get directAncestors() {
    const ancestors = []
    let el = this
    while (el.parent) {
      el = el.parent
      ancestors.push(el)
    }
    return ancestors
  }

  get absX() {
    if (this.parent) {
      return this.parent.contentX + this.x
    } else {
      return this.x
    }
  }

  get absY() {
    if (this.parent) {
      return this.parent.contentY + this.y
    } else {
      return this.y
    }
  }

  // Where contents should be positioned.
  get contentX() { return this.absX + this.hPadding }
  get contentY() { return this.absY + this.vPadding }
  get contentW() { return this.w - this.hPadding * 2 }
  get contentH() { return this.h - this.vPadding * 2 }

  get left()   { return this.x }
  get right()  { return this.x + this.w }
  get top()    { return this.y }
  get bottom() { return this.y + this.h }

  get absLeft()   { return this.absX }
  get absRight()  { return this.absX + this.w - 1 }
  get absTop()    { return this.absY }
  get absBottom() { return this.absY + this.h - 1 }
}

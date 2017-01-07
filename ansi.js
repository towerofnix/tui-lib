const ESC = '\x1b'

const isDigit = char => '0123456789'.indexOf(char) >= 0

const ansi = {
  ESC,

  // Attributes
  A_RESET:    0,
  A_BRIGHT:   1,
  A_DIM:      2,
  A_INVERT:   7,
  C_BLACK:   30,
  C_RED:     31,
  C_GREEN:   32,
  C_YELLOW:  33,
  C_BLUE:    34,
  C_MAGENTA: 35,
  C_CYAN:    36,
  C_WHITE:   37,
  C_RESET:   39,

  clearScreen() {
    // Clears the screen, removing any characters displayed, and resets the
    // cursor position.

    return `${ESC}[2J`
  },

  moveCursorRaw(line, col) {
    // Moves the cursor to the given line and column on the screen.
    // Returns the pure ANSI code, with no modification to line or col.

    return `${ESC}[${line};${col}H`
  },

  moveCursor(line, col) {
    // Moves the cursor to the given line and column on the screen.
    // Note that since in JavaScript indexes start at 0, but in ANSI codes
    // the top left of the screen is (1, 1), this function adjusts the
    // arguments to act as if the top left of the screen is (0, 0).

    return `${ESC}[${line + 1};${col + 1}H`
  },

  hideCursor() {
    // Makes the cursor invisible.

    return `${ESC}[?25l`
  },

  showCursor() {
    // Makes the cursor visible.

    return `${ESC}[?25h`
  },

  resetAttributes() {
    // Resets all attributes, including text decorations, foreground and
    // background color.

    return `${ESC}[0m`
  },

  setAttributes(attrs) {
    // Set some raw attributes. See the attributes section of the ansi.js
    // source code for attributes that can be used with this; A_RESET resets
    // all attributes.

    return `${ESC}[${attrs.join(';')}m`
  },

  setForeground(color) {
    // Sets the foreground color to print text with. See C_(COLOR) for colors
    // that can be used with this; C_RESET resets the foreground.
    //
    // If null or undefined is passed, this function will return a blank
    // string (no ANSI escape codes).

    if (typeof color === 'undefined' || color === null) {
      return ''
    }

    return ansi.setAttributes([color])
  },

  invert() {
    // Inverts the foreground and background colors.

    return `${ESC}[7m`
  },



  interpret(text, scrRows, scrCols) {
    // Interprets the given ansi code, more or less.

    const blank = {
      attributes: [],
      char: ' '
    }

    const chars = new Array(scrRows * scrCols).fill(blank)

    let cursorRow = 1
    let cursorCol = 1
    const attributes = []
    const getCursorIndex = () => (cursorRow - 1) * scrCols + (cursorCol - 1)

    for (let charI = 0; charI < text.length; charI++) {
      if (text[charI] === ESC) {
        charI++

        if (text[charI] !== '[') {
          throw new Error('ESC not followed by [')
        }

        charI++

        const args = []
        let val = ''
        while (isDigit(text[charI])) {
          val += text[charI]
          charI++

          if (text[charI] === ';') {
            charI++
            args.push(val)
            val = ''
            continue
          }
        }
        args.push(val)

        // CUP - Cursor Position (moveCursor)
        if (text[charI] === 'H') {
          cursorRow = args[0]
          cursorCol = args[1]
        }

        // ED - Erase Display (clearScreen)
        if (text[charI] === 'J') {
          // ESC[2J - erase whole display
          if (args[0] === '2') {
            chars.fill(blank)
            charI += 3
            cursorCol = 1
            cursorRow = 1
          }

          // ESC[1J - erase to beginning
          else if (args[0] === '1') {
            for (let i = 0; i < getCursorIndex(); i++) {
              chars[i] = blank
            }
          }

          // ESC[0J - erase to end
          else if (args.length === 0 || args[0] === '0') {
            for (let i = getCursorIndex(); i < chars.length; i++) {
              chars[i] = blank
            }
          }
        }

        // SGR - Select Graphic Rendition
        if (text[charI] === 'm') {
          for (let arg of args) {
            if (arg === '0') {
              attributes.splice(0, attributes.length)
            } else {
              attributes.push(arg)
            }
          }
        }

        continue
      }

      // debug
      /*
      if (text[charI] === '.') {
        console.log(
          `#1-char "${text[charI]}" at ` +
          `(${cursorRow},${cursorCol}):${getCursorIndex()} ` +
          ` attr:[${attributes.join(';')}]`
        )
      }
      */

      chars[getCursorIndex()] = {
        char: text[charI],
        attributes: attributes.slice()
      }

      cursorCol++

      if (cursorCol > scrCols) {
        cursorCol = 1
        cursorRow++
      }
    }

    // Character concatenation -----------

    // Move to the top left of the screen initially.
    const result = [ ansi.moveCursorRaw(1, 1) ]

    let lastChar = {
      char: '',
      attributes: []
    }

    //let n = 1 // debug

    for (let char of chars) {
      const newAttributes = (
        char.attributes.filter(attr => !(lastChar.attributes.includes(attr)))
      )

      const removedAttributes = (
        lastChar.attributes.filter(attr => !(char.attributes.includes(attr)))
      )

      // The only way to practically remove any character attribute is to
      // reset all of its attributes and then re-add its existing attributes.
      // If we do that, there's no need to add new attributes.
      if (removedAttributes.length) {
        // console.log(
        //   `removed some attributes "${char.char}"`, removedAttributes
        // )
        result.push(ansi.resetAttributes())
        result.push(`${ESC}[${char.attributes.join(';')}m`)
      } else if (newAttributes.length) {
        result.push(`${ESC}[${newAttributes.join(';')}m`)
      }

      // debug
      /*
      if (char.char !== ' ') {
        console.log(
          `#2-char ${char.char}; ${chars.indexOf(char) - n} inbetween`
        )
        n = chars.indexOf(char)
      }
      */

      result.push(char.char)

      lastChar = char
    }

    return result.join('')
  }
}

module.exports = ansi

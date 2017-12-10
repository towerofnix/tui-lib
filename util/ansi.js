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

  cleanCursor() {
    // A combination of codes that generally cleans up the cursor.

    return ansi.resetAttributes() + ansi.showCursor()
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

  invertOff() {
    // Un-inverts the foreground and backgrund colors.

    return `${ESC}[27m`
  },

  requestCursorPosition() {
    // Requests the position of the cursor.
    // Expect a stdin-result '\ESC[l;cR', where l is the line number (1-based),
    // c is the column number (also 1-based), and R is the literal character
    // 'R' (decimal code 82).

    return `${ESC}[6n`
  },

  isANSICommand(buffer, code = null) {
    return (
      buffer[0] === 0x1b && buffer[1] === 0x5b &&
      (code ? buffer[buffer.length - 1] === code : true)
    )
  },


  interpret(text, scrRows, scrCols, oldChars = null, lastChar = null) {
    // Interprets the given ansi code, more or less.

    const blank = {
      attributes: [],
      char: ' '
    }

    const chars = new Array(scrRows * scrCols).fill(blank)

    let showCursor = true
    let cursorRow = 1
    let cursorCol = 1
    const attributes = []
    const getCursorIndex = () => (cursorRow - 1) * scrCols + (cursorCol - 1)

    for (let charI = 0; charI < text.length; charI++) {
      if (text[charI] === ESC) {
        if (false) {
          chars[getCursorIndex()] = {char: '%', attributes: []}
          cursorCol++
          continue
        }

        charI++

        if (text[charI] !== '[') {
          throw new Error('ESC not followed by [')
        }

        charI++

        // Selective control sequences (look them up) - we can just skip the
        // question mark.
        if (text[charI] === '?') {
          charI++
        }

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

        // SM - Set Mode
        if (text[charI] === 'h') {
          if (args[0] === '25') {
            showCursor = true
          }
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

        // RM - Reset Mode
        if (text[charI] === 'l') {
          if (args[0] === '25') {
            showCursor = false
          }
        }

        // SGR - Select Graphic Rendition
        if (text[charI] === 'm') {
          const removeAttribute = attr => {
            if (attributes.includes(attr)) {
              attributes.splice(attributes.indexOf(attr), 1)
            }
          }

          for (const arg of args) {
            if (arg === '0') {
              attributes.splice(0, attributes.length)
            } else if (arg === '22') { // Neither bold nor faint
              removeAttribute('1')
              removeAttribute('2')
            } else if (arg === '23') { // Neither italic nor Fraktur
              removeAttribute('3')
              removeAttribute('20')
            } else if (arg === '24') { // Not underlined
              removeAttribute('4')
            } else if (arg === '25') { // Blink off
              removeAttribute('5')
            } else if (arg === '27') { // Inverse off
              removeAttribute('7')
            } else if (arg === '28') { // Conceal off
              removeAttribute('8')
            } else if (arg === '29') { // Not crossed out
              removeAttribute('9')
            } else if (arg === '39') { // Default foreground
              for (let i = 0; i < 10; i++) {
                removeAttribute('3' + i)
              }
            } else if (arg === '49') { // Default background
              for (let i = 0; i < 10; i++) {
                removeAttribute('4' + i)
              }
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

    // SPOooooOOoky diffing! -------------
    //
    // - Search for series of differences. This means a collection of characters
    //   which have different text or attribute properties.
    //
    // - Figure out how to print these differences. Move the cursor to the beginning
    //   character's row/column, then print the differences.

    const newChars = chars

    const differences = []

    if (oldChars === null) {
      differences.push({i: 0, chars: [...newChars]})
    } else {
      const charsEqual = (oldChar, newChar) => {
        // TODO: Check attributes.

        if (oldChar.char !== newChar.char) {
          return false
        }

        let oldAttrs = oldChar.attributes.slice()
        let newAttrs = newChar.attributes.slice()

        while (newAttrs.length) {
          const attr = newAttrs.shift()
          if (oldAttrs.includes(attr)) {
            oldAttrs.splice(oldAttrs.indexOf(attr), 1)
          } else {
            return false
          }
        }

        oldAttrs = oldChar.attributes.slice()
        newAttrs = newChar.attributes.slice()

        while (oldAttrs.length) {
          const attr = oldAttrs.shift()
          if (newAttrs.includes(attr)) {
            newAttrs.splice(newAttrs.indexOf(attr), 1)
          } else {
            return false
          }
        }

        return true
      }

      let curDiff = null

      for (let i = 0; i < chars.length; i++) {
        const oldChar = oldChars[i]
        const newChar = newChars[i]

        // TODO: Some sort of "distance" before we should clear curDiff?
        // It may take *less* characters if this diff and the next are merged
        // (entering a single character is smaller than the length of the code
        // used to move past that character). Probably not very significant of
        // an impact, though.
        if (charsEqual(oldChar, newChar)) {
          curDiff = null
        } else {
          if (curDiff === null) {
            curDiff = {i, chars: []}
            differences.push(curDiff)
          }

          curDiff.chars.push(newChar)
        }
      }
    }

    // Character concatenation -----------

    lastChar = lastChar || {
      char: '',
      attributes: []
    }

    const result = []

    for (const diff of differences) {
      const col = diff.i % scrCols
      const row = (diff.i - col) / scrCols
      result.push(ansi.moveCursor(row, col))

      for (const char of diff.chars) {
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
          result.push(ansi.resetAttributes())
          result.push(`${ESC}[${char.attributes.join(';')}m`)
        } else if (newAttributes.length) {
          result.push(`${ESC}[${newAttributes.join(';')}m`)
        }

        result.push(char.char)

        lastChar = char
      }
    }

    return {
      newChars: newChars.slice(),
      lastChar: Object.assign({}, lastChar),
      screen: result.join('')
    }
  }
}

module.exports = ansi

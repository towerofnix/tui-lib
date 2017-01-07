module.exports = function wrap(str, width) {
  // Wraps a string into separate lines. Returns an array of strings, for
  // each line of the text.

  const lines = []
  const words = str.split(' ')

  let curLine = words[0]

  for (let word of words.slice(1)) {
    if (curLine.length + word.length > width) {
      lines.push(curLine)
      curLine = word
    } else {
      curLine += ' ' + word
    }
  }

  lines.push(curLine)

  return lines
}

module.exports = function count(arr) {
  // Counts the number of times the items of an array appear (only on the top
  // level; it doesn't search through nested arrays!). Returns a map of
  // item -> count.

  const map = new Map()

  for (let item of arr) {
    if (map.has(item)) {
      map.set(item, map.get(item) + 1)
    } else {
      map.set(item, 1)
    }
  }

  return map
}

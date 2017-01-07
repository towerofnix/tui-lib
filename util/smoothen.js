module.exports = function(tx, x, divisor) {
  // Smoothly transitions givens X to TX using a given divisor. Rounds the
  // amount moved.

  const move = (tx - x) / divisor

  if (move > 0.5) {
    return x + Math.ceil(move)
  } else if (move < -0.5) {
    return x + Math.floor(move)
  } else if (tx > 0) {
    return Math.ceil(tx)
  } else {
    return Math.floor(tx)
  }
}

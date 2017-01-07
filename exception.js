module.exports = function exception(code, message) {
  // Makes a custom error with the given code and message.

  const err = new Error(`${code}: ${message}`)
  err.code = code
  return err
}

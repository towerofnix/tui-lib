module.exports = function waitForData(stream, cond = null) {
  return new Promise(resolve => {
    stream.on('data', data => {
      if (cond ? cond(data) : true) {
        resolve(data)
      }
    })
  })
}

'use strict'

const nanoid = require('nanoid')
const path = require('path')
const R = require('ramda')

const requireRegexp = /^require\(([^)]*)\)$/

const reduceMatchedKeyPaths = (obj, keyPath = []) => {
  return Object.keys(obj).reduce((acc, key) => {
    const fullKeyPath = [...keyPath, key]
    const value = obj[key]

    if (typeof value === 'object') {
      return [...acc, ...reduceMatchedKeyPaths(value, fullKeyPath)]
    }

    if (typeof value === 'string') {
      if (requireRegexp.test(value)) {
        return [...acc, fullKeyPath]
      }
    }

    return acc
  }, [])
}

module.exports = function loader(content) {
  if (typeof this.query === 'string') {
    throw new Error(
      'does not support inline querystring as options, define your options in webpack.config.js instead'
    )
  }

  const manifest = JSON.parse(content)

  const {mapVersion} = this.query || {}
  if (mapVersion) {
    const pkgPath = path.resolve('./package.json')
    const pkg = require(pkgPath)
    this.addDependency(pkgPath)

    manifest.version = pkg.version
  }

  const idMappings = reduceMatchedKeyPaths(manifest).map((matchedKeyPath) => {
    return {
      id: nanoid(),
      filePath: R.path(matchedKeyPath, manifest).replace(requireRegexp, (match, p1) => p1),
      keyPath: matchedKeyPath
    }
  })

  const manifestWithIds = idMappings.reduce((acc, idMapping) => {
    return R.set(R.lensPath(idMapping.keyPath), idMapping.id, acc)
  }, manifest)

  const manifestStr = JSON.stringify(JSON.stringify(manifestWithIds))
  const unevalManifest = idMappings.reduce((acc, idMapping) => {
    return acc.replace(idMapping.id, `" + require(${JSON.stringify(idMapping.filePath)}) + "`)
  }, manifestStr)
  return 'module.exports = ' + unevalManifest
}

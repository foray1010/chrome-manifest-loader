'use strict'

const _ = require('lodash')
const nanoid = require('nanoid')
const path = require('path')

const requireRegexp = /^require\(([^)]*)\)$/

const reduceMatchedKeyPaths = (obj, keyPath) => {
  return _(obj)
    .flatMap((value, key) => {
      const newKeyPath = _.reject([keyPath, key], _.isNil).join('.')

      if (typeof value === 'object') {
        return reduceMatchedKeyPaths(value, newKeyPath)
      }

      if (typeof value === 'string') {
        if (requireRegexp.test(value)) {
          return newKeyPath
        }
      }

      return null
    })
    .compact()
    .value()
}

module.exports = function loader(content) {
  if (typeof this.query === 'string') {
    throw new Error(
      'does not support inline querystring as options, define your options in webpack.config.js instead'
    )
  }

  const manifest = JSON.parse(content)

  const mapVersion = _.get(this.query, 'mapVersion')
  if (mapVersion) {
    const pkgPath = path.resolve('./package.json')
    const pkg = require(pkgPath)
    this.addDependency(pkgPath)

    manifest.version = pkg.version
  }

  const matchedKeyPaths = reduceMatchedKeyPaths(manifest)
  const idMappings = matchedKeyPaths.map((matchedKeyPath) => {
    const filePath = _.get(manifest, matchedKeyPath).replace(requireRegexp, (match, p1) => p1)
    const id = nanoid()

    _.set(manifest, matchedKeyPath, id)

    return {
      id,
      filePath
    }
  })

  const manifestStr = JSON.stringify(JSON.stringify(manifest))
  const unevalManifest = idMappings.reduce(
    (acc, mapping) =>
      acc.replace(mapping.id, `" + require(${JSON.stringify(mapping.filePath)}) + "`),
    manifestStr
  )
  return 'module.exports = ' + unevalManifest
}

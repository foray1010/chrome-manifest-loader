'use strict'

const _ = require('lodash')
const path = require('path')
const uuidV4 = require('uuid/v4')

const exportsString = 'module.exports = '
const pkgPath = path.resolve('./package.json')
const requireRegexp = /^require\(([^)]*)\)$/

const reduceMatchedKeyPaths = (obj, keyPath) => {
  return _(obj)
    .flatMap((value, key) => {
      const newKeyPath = _.compact([keyPath, key]).join('.')

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

const loader = function (content) {
  if (typeof this.query === 'string') {
    throw new Error('does not support inline querystring as options, define your options in webpack.config.js instead')
  }

  const manifest = JSON.parse(content)

  const mapVersion = _.get(this.query, 'mapVersion')
  if (mapVersion) {
    const pkg = require(pkgPath)
    this.addDependency(pkgPath)

    manifest.version = pkg.version
  }

  const matchedKeyPaths = reduceMatchedKeyPaths(manifest)
  const uuidMappings = matchedKeyPaths.map((matchedKeyPath) => {
    const filePath = _.get(manifest, matchedKeyPath).replace(requireRegexp, (match, p1) => p1)
    const id = uuidV4()

    _.set(manifest, matchedKeyPath, id)

    return {
      id: id,
      filePath: filePath
    }
  })

  const unevalManifest = JSON.stringify(
    JSON.stringify(manifest)
  )

  return exportsString + uuidMappings.reduce((acc, mapping) => {
    return acc.replace(mapping.id, `" + require(${JSON.stringify(mapping.filePath)}) + "`)
  }, unevalManifest)
}

module.exports = loader

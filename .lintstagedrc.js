'use strict'

module.exports = {
  '*.{json,yaml,yml}': (filenames) => {
    const commands = []

    filenames
      .filter((name) => name.endsWith('/package.json'))
      .forEach((name) => {
        commands.push(`sort-package-json ${name}`)
      })

    commands.push(`yarn prettier --write ${filenames.join(' ')}`)

    return commands
  },
  '*.js': ['yarn prettier --write', 'yarn eslint --fix'],
  '*.md': (filenames) => {
    return [`yarn prettier --write ${filenames.join(' ')}`, 'yarn remark .']
  },
}

# chrome-manifest-loader

```sh
npm install --save-dev chrome-manifest-loader extract-loader file-loader
```

Chrome manifest loader for webpack

- support Chrome, Firefox and Opera `manifest.json`

- import assets that is defined in `manifest.json`

- map `package.json` version to `manifest.json` version

## Usage

first, import `manifest.json` in your index js once

### Require assets and map the asset path

Wrap your asset path with `require()`

- the asset path should be relative to current `manifest.json` path

- if no `./` or `../` prefix, it will be consider as under `node_modules`

`webpack.config.js`

```js
{
  "module": {
    "rules": [
      {
        test: /\/manifest\.json$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]'
            }
          },
          'extract-loader',
          'chrome-manifest-loader'
        ],
        // needed for webpack 4 to override default json loader
        type: 'javascript/auto'
      }
    ]
  }
}
```

`manifest.json`

```json
{
  "icon": {
    "16": "require(./img/icon16.png)"
  }
}
```

__output__

```json
{
  "icon": {
    "16": "file path defined by other loader, eg: file-loader"
  }
}
```

### Map package.json version to manifest.json version

Option: `mapVersion: true`

`webpack.config.js`

```js
{
  "module": {
    "rules": [
      {
        test: /\/manifest\.json$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]'
            }
          },
          'extract-loader',
          {
            loader: 'chrome-manifest-loader',
            options: {
              mapVersion: true
            }
          }
        ],
        // needed for webpack 4 to override default json loader
        type: 'javascript/auto'
      }
    ]
  }
}
```

`package.json`

```json
{
  "version": "1.0.1"
}
```

`manifest.json`

```json
{}
```

__output__ (`manifest.json`)

```json
{
  "version": "1.0.1"
}
```

'use strict'

const debug = require('debug')('loopback:mixin:computed')
const _ = require('lodash')
const Promise = require('bluebird')

module.exports = (Model, options) => {
  // Trigger a warning and remove the property from the watchlist when one of
  // the property is not found on the model or the defined callback is not found
  _.mapKeys(options.properties, (callback, property) => {
    if (_.isUndefined(Model.definition.properties[property])) {
      debug('Property %s on %s is undefined', property, Model.modelName)
    }

    if (typeof Model[callback] !== 'function') {
      debug('Callback %s for %s is not a model function', callback, property)
    }
  })

  debug('Computed mixin for Model %s with options %o', Model.modelName, options)

  // The loaded observer is triggered when an item is loaded
  Model.observe('loaded', (ctx, next) => {
    // We don't act on new instances
    if (ctx.isNewInstance) {
      return next()
    }

    return Promise.map(Object.keys(options.properties), property => {
      const callback = options.properties[property]

      if (typeof Model[callback] !== 'function') {
        debug('Function %s not found on Model', callback)
        return false
      }

      debug('Computing property %s with callback %s', property, callback)

      // `Promise.resolve` will normalize promises and raw values
      return Promise
        .resolve(Model[callback](ctx.data, ctx.options))
        .then(value => (ctx.data[property] = value))
    })
  })
}

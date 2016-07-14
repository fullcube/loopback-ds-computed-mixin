var debug = require('debug')('loopback-ds-computed-mixin');
var _ = require('lodash');
var Promise = require('bluebird');

module.exports = function(Model, options) {
  'use strict';

  // Trigger a warning and remove the property from the watchlist when one of
  // the property is not found on the model or the defined callback is not found
  _.mapKeys(options.properties, function(callback, property) {
    if (_.isUndefined(Model.definition.properties[property])) {
      debug('Property %s on %s is undefined', property, Model.modelName);
    }

    if (typeof Model[callback] !== 'function') {
      debug('Callback %s for %s is not a model function', callback, property);
    }
  });

  debug('Computed mixin for Model %s with options %o', Model.modelName, options);

  // The loaded observer is triggered when an item is loaded
  Model.observe('loaded', function(ctx, next) {
    // We don't act on new instances
    if (ctx.instance === undefined) {
      return next();
    }

    Promise.map(Object.keys(options.properties), function(property) {
      var callback = options.properties[property];

      if (typeof Model[callback] !== 'function') {
        debug('Function %s not found on Model', callback);
        return false;
      }

      debug('Computing property %s with callback %s', property, callback);

      var value = Model[callback](ctx.instance);
      if (value.then === undefined) {
        ctx.instance[property] = value;
      } else {
        return Model[callback](ctx.instance)
          .then(function(res) {
            ctx.instance[property] = res;
          })
          .catch(next);
      }
    }).then(function() {
      next();
    }).catch(next);
  });
};

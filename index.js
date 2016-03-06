var debug = require('debug')('loopback-ds-computed-mixin');
var _ = require('lodash');

function computed(Model, options) {
  'use strict';

  // Trigger a warning and remove the property from the watchlist when one of
  // the property is not found on the model or the defined callback is not found
  _.mapKeys(options.properties, function(callback, property) {
    var removeProperty = false;
    if (_.isUndefined(Model.definition.properties[property])) {
      console.warn('Property %s on %s is undefined', property, Model.modelName);
      removeProperty = true;
    }

    if (typeof Model[callback] !== 'function') {
      console.warn('Callback %s for %s is not a model function', callback, property);
      removeProperty = true;
    }

    if (removeProperty) {
      debug('Remove computed property %s for %s ', property, Model.modelName);
      delete options.properties[property];
    }
  });

  debug('Computed mixin for Model %s with options %o', Model.modelName, options);

  Model.observe('access', function logQuery(ctx, next) {

    // We store the fields filter, if any, to check it later in the loaded observer
    ctx.options.computedInfo = {};
    ctx.options.computedInfo.hasFieldFilter = !_.isUndefined(ctx.query.fields);
    if (ctx.options.computedInfo.hasFieldFilter) ctx.options.computedInfo.fieldList = ctx.query.fields;

    next();
  });

  // The loaded observer is triggered when an item is loaded
  Model.observe('loaded', function(ctx, next) {
    // We don't act on new instances
    if (ctx.instance === undefined) {
      return next();
    }

    Promise.map(Object.keys(options.properties), function(property) {
      var callback = options.properties[property];

      if (typeof Model[callback] !== 'function') {
        console.warn('Function %s not found on Model', callback);
        return false;
      }

      // If the query includes a field filter, we do not continue if the field was not specified
      if (ctx.options.computedInfo.hasFieldFilter && ctx.options.computedInfo.fieldList.indexOf(property) == -1) {
        debug('Field %s not included in field filter', property);
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
}

module.exports = function mixin(app) {
  app.loopback.modelBuilder.mixins.define('Computed', computed);
};

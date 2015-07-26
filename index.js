var debug = require('debug')('loopback-ds-computed-mixin');

function computed(Model, options) {
  'use strict';
  debug('Computed mixin for Model %s with options %o', Model.modelName, options);
}

module.exports = function mixin(app) {
  app.loopback.modelBuilder.mixins.define('Computed', computed);
};

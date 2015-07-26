/* jshint mocha: true */

var debug = require('debug')('loopback-ds-mixin-skeleton');
var utils = require('loopback-datasource-juggler/lib/utils');

var loopback = require('loopback');
var lt = require('loopback-testing');

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
chai.use(require('sinon-chai'));
require('mocha-sinon');

// Create a new loopback app.
var app = loopback();

// Set up promise support for loopback in non-ES6 runtime environment.
global.Promise = require('bluebird');

// import our Changed mixin.
require('./')(app);

// Connect to db
var dbConnector = loopback.memory();

// Main test
describe('loopback datasource property', function () {

  lt.beforeEach.withApp(app);

  beforeEach(function (done) {

    // Create a new model and attach the mixin
    var Item = this.Item = loopback.PersistedModel.extend('item', {
      name: String
    }, {
      mixins: {
        Skeleton: {}
      }
    });

    // Attach model to db
    Item.attachTo(dbConnector);
    app.model(Item);
    app.use(loopback.rest());
    app.set('legacyExplorer', false);
    new lt.TestDataBuilder()
      .define('item', Item, {
        name: 'Item name'
      })
      .buildTo(this, done);
  });


  it('This is a test.', function (done) {
    var item = this.item;
    expect(item.name).to.equal('Item name');
    done();
  });
});

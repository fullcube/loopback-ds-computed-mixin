const loopback = require('loopback')
const lt = require('loopback-testing')
const chai = require('chai')
const { expect } = chai

global.Promise = require('bluebird')

// Create a new loopback app.
const app = loopback()

// import our mixin.
require('../lib')(app)

// Create datasource.
const dbConnector = loopback.createDataSource({
  connector: loopback.Memory,
  file: 'db.json',
})

const now = new Date()

const Item = loopback.PersistedModel.extend('item', {
  name: String,
  status: String,
  readonly: Boolean,
  promised: String,
  requestedAt: Date,
}, {
  mixins: {
    Computed: {
      properties: {
        readonly: 'computedReadonly',
        requestedAt: 'computedRequestedAt',
        promised: 'computedPromised',
      },
    },
  },
})

// Define computed property callbacks.
Item.computedReadonly = item => Boolean(item.status === 'archived')
Item.computedRequestedAt = () => now
Item.computedPromised = item => Promise.resolve(`${item.name}: As promised I get back to you!`)

// Attach model to db.
Item.attachTo(dbConnector)
app.model(Item)
app.use(loopback.rest())
app.set('legacyExplorer', false)

describe('loopback computed property', function() {

  lt.beforeEach.withApp(app)

  before(function() {
    return Item.destroyAll()
  })

  before(function(done) {
    new lt.TestDataBuilder()
      .define('itemOne', Item, {
        name: 'Item 1',
        status: 'archived',
      })
      .define('itemTwo', Item, {
        name: 'Item 2',
        status: 'new',
      })
      .buildTo(this, done)
  })

  before(function() {
    return Promise.join(Item.findById(this.itemOne.id), Item.findById(this.itemTwo.id), (itemOne, itemTwo) => {
      this.itemOne = itemOne
      this.itemTwo = itemTwo
    })
  })

  it('should set the model property to the value returned by the defined callback', function() {
    expect(this.itemOne.requestedAt.toString()).to.equal(now.toString())
    expect(this.itemOne.readonly).to.equal(true)
    expect(this.itemTwo.requestedAt.toString()).to.equal(now.toString())
    expect(this.itemTwo.readonly).to.equal(false)
  })

  it('should set the model property to the value resolved by the defined callback\'s promise', function() {
    expect(this.itemOne.promised).to.equal('Item 1: As promised I get back to you!')
    expect(this.itemTwo.promised).to.equal('Item 2: As promised I get back to you!')
  })

  it('should not store the computed property', function() {
    return this.itemOne.updateAttributes({ readonly: false })
      .then(item => {
        /* eslint global-require: 0 */
        const db = require('../db.json')
        const itemFromDb = JSON.parse(db.models.item[item.id])

        expect(item).to.have.property('readonly', true)
        expect(item).to.have.property('requestedAt')
        expect(item).to.have.property('promised')

        expect(itemFromDb).to.have.property('id', item.id)
        expect(itemFromDb).to.have.property('name', 'Item 1')
        expect(itemFromDb).to.not.have.property('readonly')
        expect(itemFromDb).to.not.have.property('requestedAt')
        expect(itemFromDb).to.not.have.property('promised')
      })
  })
})

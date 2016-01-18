/**
 * Created by rom on 01/17/16.
 */
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");

var Joi = require('joi');

chai.use(chaiAsPromised);
var expect = chai.expect;

var JsonSchemaHandler = require('../../../lib/handlers/jsonSchemaHandler');
var ValidationError = require('../../../lib/validator/validationError');

/**
 * Joi schema object for the tests
 */
var testSchema = Joi.object().keys({
  name: Joi.string().required(),
  obj: Joi.object().required()
});

/**
 * Handler object properties
 * @type {{name: string, pattern: string, options: {schema: *}}}
 */
var handlerObject = {
  name: "TestHandler",
  pattern: "BKMD.TEST.CREATE",
  options: {
    schema: testSchema
  }
};

/**
 * Build a message for the handler
 * Get a json message, and wrap it with JSON.stringify and a Buffer
 * Return an object with the message inside the content key
 * This is the type of message the handler expect to get
 * @param jsonMsg
 * @returns {{content: *}}
 */
function buildMessage(jsonMsg) {
  return {
    content: new Buffer(JSON.stringify(jsonMsg))
  };
}

describe("Json Schema Handler", function () {

  /**
   * Declare new JsonSchemaHandler with the default handler object properties
   */
  beforeEach(function () {
    this.handler = new JsonSchemaHandler(handlerObject.name, handlerObject.pattern, handlerObject.options);
  });

  /**
   * Constructor tests
   */
  describe('Check Constructor', function () {
    it('No options', function () {
      var handler = function () {
        return new JsonSchemaHandler(handlerObject.name, handlerObject.pattern)
      };
      expect(handler).to.throw(Error);
    });

    it('No schema in options', function () {
      var handler = function () {
        return new JsonSchemaHandler(handlerObject.name, handlerObject.pattern, {})
      };
      expect(handler).to.throw(Error);
    });

    it('No Joi schema', function () {
      var handler = function () {
        return new JsonSchemaHandler(handlerObject.name, handlerObject.pattern, {schema: {}})
      };
      expect(handler).to.throw(Error);
    });
  });

  /**
   * preHandle test
   */
  describe('Check preHandle', function () {
    it('Return message', function (done) {
      var jsonMsg = {
        name: "Name",
        obj: {
          id: 2,
          comment: "Hello World"
        }
      };

      var promise = this.handler.preHandle(buildMessage(jsonMsg));
      expect(promise).to.eventually.be.deep.equal(jsonMsg).notify(done);
    });

    it('Validation error', function (done) {
      var jsonMsg = {
        noMame: "Name",
        obj: {
          id: 2,
          comment: "Hello World"
        }
      };

      var promise = this.handler.preHandle(buildMessage(jsonMsg));
      expect(promise).to.eventually.be.rejectedWith(ValidationError).notify(done);
    });

    it('Json Error', function (done) {
      var msg = {
        content: new Buffer("Non JSON message")
      };

      var promise = this.handler.preHandle(msg);
      expect(promise).to.eventually.be.rejectedWith(SyntaxError).notify(done);
    });
  });

  /**
   * postHandle test
   */
  describe('Check postHandle', function () {
    it('Stringify message', function (done) {
      var jsonMsg = {
        name: "Name",
        obj: {
          id: 2,
          comment: "Hello World"
        }
      };

      var promise = this.handler.postHandle(jsonMsg);
      expect(promise).to.eventually.be.equal(JSON.stringify(jsonMsg)).notify(done);
    });

    it('Reject', function (done) {
      var promise = Promise.reject("Generic Error");
      expect(promise).to.eventually.be.rejectedWith("Generic Error").notify(done);
    });
  });
});
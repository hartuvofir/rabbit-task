/**
 * Created by asafdavid on 23/02/2017.
 */
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import UnknownHandler from '../../../src/lib/handlers/unknownHandler';
import HandlerRouter from '../../../src/lib/handlers/router';

chai.use(sinonChai);
const { expect } = chai;

const handler1 = { name: 'x', pattern: 'X', handle: () => Promise.resolve('X') };
const handler2 = { name: 'y', pattern: 'Y', handle: () => Promise.resolve('Y') };
const defaultHandler = new UnknownHandler();
defaultHandler.doHandle = () => Promise.resolve('default');

describe('HandlerRouter', function () {
  describe('constructor', function () {
    it('creates a router with no handlers', function () {
      const router = new HandlerRouter();
      expect(router).to.be.an.instanceof(HandlerRouter);
      expect(router.handlers).to.have.length.of(0);
    });

    it('creates a router with one handler', function () {
      const router = new HandlerRouter(handler1);
      expect(router).to.be.an.instanceof(HandlerRouter);
      expect(router.handlers).to.have.lengthOf(1);
    });

    it('creates a router with array of handlers', function () {
      const router = new HandlerRouter([handler1, handler2]);
      expect(router).to.be.an.instanceof(HandlerRouter);
      expect(router.handlers).to.have.lengthOf(2);
    });
  });

  describe('setDefaultHandler', function () {
    it('throws an exception for an empty argument', function () {
      const router = new HandlerRouter();
      expect(router.setDefaultHandler).to.throw(Error);
    });

    it('throws an exception for a random object', function () {
      const router = new HandlerRouter();
      expect(() => router.setDefaultHandler({})).to.throw(Error);
    });

    it('throws if the route is not an instance of MsgHandler', function () {
      const router = new HandlerRouter();
      expect(() => router.setDefaultHandler(handler1)).to.throw(Error);
    });

    it('sets the default handler', function () {
      const router = new HandlerRouter();
      router.setDefaultHandler(new UnknownHandler());
      expect(router.defaultHandler).to.be.an.instanceOf(UnknownHandler);
    });
  });

  describe('addRoutes', function () {
    it('validates the provided handler', function () {
      const router = new HandlerRouter();
      expect(() => router.addRoutes({})).to.throw(/Invalid handler/);
      expect(() => router.addRoutes({ name: 'a' })).to.throw(/Invalid handler/);
      expect(() => router.addRoutes({ handler: 'a' })).to.throw(/Invalid handler/);
      expect(() => router.addRoutes({ topic: 'a' })).to.throw(/Invalid handler/);
      expect(() => router.addRoutes('asdas')).to.throw(/Invalid handler/);
    });

    it('adds one handler to the router', function () {
      const router = new HandlerRouter();
      router.addRoutes(handler1);
      expect(router.handlers).to.have.lengthOf(1);
    });

    it('adds array of handler to the router', function () {
      const router = new HandlerRouter();
      router.addRoutes([handler1, handler2]);
      expect(router.handlers).to.have.lengthOf(2);
    });

    it('adds handler after handler to the router', function () {
      const router = new HandlerRouter();
      router.addRoutes(handler1);
      expect(router.handlers).to.have.lengthOf(1);
      router.addRoutes(handler2);
      expect(router.handlers).to.have.lengthOf(2);
    });

    it('adds an instance of MsgHandler', function () {
      const router = new HandlerRouter();
      router.addRoutes(new UnknownHandler());
      expect(router.handlers).to.have.lengthOf(1);
    });
  });

  describe('route', function () {
    function getMsg(topic, body) {
      return {
        properties: {
          headers: { topic },
        },
        fields: {
          consumerTag: 'consumer',
        },
        content: new Buffer(body),
      };
    }

    before(function () {
      this.sender = {
        reply: sinon.spy(),
        error: sinon.spy(),
        ack: sinon.spy(),
      };
      sinon.spy(defaultHandler, 'doHandle');
      sinon.spy(handler1, 'handle');
      sinon.spy(handler2, 'handle');
      this.router = new HandlerRouter([
        handler1,
        handler2,
      ]);
      this.router.setDefaultHandler(defaultHandler);
    });

    after(function () {
      defaultHandler.doHandle.restore();
      handler1.handle.restore();
      handler2.handle.restore();
    });

    it('routes to the default handler if didn\'t match the pattern', function (done) {
      this.router.route(this.sender, getMsg('Z', JSON.stringify({ msg: 'Hi' }))).finally(() => {
        expect(defaultHandler.doHandle).to.have.been.called;
        done();
      });
    });

    it('routes a message to the right handler', function (done) {
      this.router.route(this.sender, getMsg('X', JSON.stringify({ msg: 'Hi' }))).finally(() => {
        expect(handler1.handle).to.have.been.called;
        expect(handler2.handle).to.not.have.been.called;
        done();
      });
    });
  });
});

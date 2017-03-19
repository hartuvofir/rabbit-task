/**
 * Created by asafdavid on 27/02/2017.
 */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import _ from 'lodash';

import Router from '../../src/lib/handlers/router';
import Client from '../../src/lib/client';
import RabbitService from '../../src/service/rabbitService';
import TwilioService from './twilioService';

chai.use(sinonChai);
chai.use(chaiAsPromised);
const expect = chai.expect;
const serverMeta = { serverExchangeName: 'temp' };

describe('RabbitService', function () {
  describe('toRabbitHandlers', function () {
    it('returns a valid routes object', function () {
      const handlers = RabbitService.toRabbitHandlers(TwilioService.prototype._tasks);
      expect(handlers).to.be.an.array;
      expect(handlers).to.have.length.of(2);
      const send = _.find(handlers, { name: 'sendSms' });
      expect(send).to.have.all.keys('name', 'pattern', 'handle', 'options', 'middleware');
    });

    it('map params to the method', function (done) {
      const handlers = RabbitService.toRabbitHandlers(TwilioService.prototype._tasks);
      const send = _.find(handlers, { name: 'sendSms' });

      expect(send.handle(({ content: { number: '911', text: 'Help' } })))
        .to.eventually.be.equal('message sent Help to 911').notify(done);
    });
  });

  describe('register', function () {
    it('verifies that a router was provided', function () {
      expect(() => RabbitService.register()).to.throw(/router has to be an instance of Router/);
      expect(() => RabbitService.register({}, TwilioService))
        .to.throw(/router has to be an instance of Router/);
    });

    it('verifies that a service was provided', function () {
      const router = new Router();
      expect(() => RabbitService.register(router))
        .to.throw(/service has to be an instance of BaseService/);
      expect(() => RabbitService.register(router, {}))
        .to.throw(/service has to be an instance of BaseService/);
    });

    it('registers all of the handlers', function () {
      const router = new Router();
      RabbitService.register(router, TwilioService);
      expect(router.handlers).to.be.an.array;
      expect(router.handlers).to.have.length.of(2);
    });

    it('registers all only a subset of the handlers', function () {
      const router = new Router();
      RabbitService.register(router, TwilioService, ['sendSms']);
      expect(router.handlers).to.be.an.array;
      expect(router.handlers).to.have.length.of(1);
    });

    it('ignores unknown tasks', function () {
      const router = new Router();
      RabbitService.register(router, TwilioService, ['unknown']);
      expect(router.handlers).to.be.an.array;
      expect(router.handlers).to.have.length.of(0);
    });

    it('accepts an instance of a service as well', function () {
      const router = new Router();
      RabbitService.register(router, new TwilioService());
      expect(router.handlers).to.be.an.array;
      expect(router.handlers).to.have.length.of(2);
    });
  });

  describe('getClient', function () {
    describe('validation', function () {
      it('verifies that a service was provided', function () {
        expect(() => RabbitService.getClient())
          .to.throw(/service has to be an instance of BaseService/);
      });

      it('verifies that a client was provided', function () {
        expect(() => RabbitService.getClient(TwilioService))
          .to.throw(/client must be an instance of Client/);
      });

      it('verifies that a serverMeta was provided', function () {
        expect(() => RabbitService.getClient(TwilioService, new Client()))
          .to.throw(/wrong serverMeta was provided/);
        expect(() => RabbitService.getClient(TwilioService, new Client(), {}))
          .to.throw(/wrong serverMeta was provided/);
        expect(() => RabbitService.getClient(TwilioService, new Client(), { stam: '' }))
          .to.throw(/wrong serverMeta was provided/);
      });

      it('returns an interface object for a wanted service', function () {
        const client = RabbitService.getClient(TwilioService, new Client(), serverMeta);
        expect(client).to.be.an.object;
        expect(client).to.have.all.keys('sendSms', 'receiveSms');
      });
    });

    describe('sync', function () {
      beforeEach(function () {
        this.rabbitClient = new Client();
      });

      it('defines a sync task', function (done) {
        this.rabbitClient.sendSync = () =>
          Promise.resolve({ content: new Buffer('{"status": "ok"}') });

        /**
         * Defines a TwilioService client interface
         * @type {TwilioService}
         */
        const client = RabbitService.getClient(TwilioService, this.rabbitClient, serverMeta);
        expect(client.sendSms('911', 'Help')).to.eventually
          .deep.equal({ status: 'ok' }).and.notify(done);
      });

      it('handles rabbit errors correctly', function (done) {
        this.rabbitClient.sendSync = () =>
          Promise.reject({ content: new Buffer('{"status": "bad"}') });

        /**
         * Defines a TwilioService client interface
         * @type {TwilioService}
         */
        const client = RabbitService.getClient(TwilioService, this.rabbitClient, serverMeta);
        expect(client.sendSms('911', 'Help'))
          .to.eventually.be.rejectedWith(Error, '{"status": "bad"}').and.notify(done);
      });
    });
  });

  describe('async', function () {
    beforeEach(function () {
      this.rabbitClient = new Client();
    });

    it('defines an async task', function (done) {
      this.rabbitClient.sendAsync = () =>
        Promise.resolve();
      const context = {};

      /**
       * Defines a TwilioService client interface
       * @type {TwilioService}
       */
      const client = RabbitService.getClient(TwilioService, this.rabbitClient, serverMeta);
      expect(client.receiveSms(context)).to.eventually.be.fulfilled.and.notify(done);
    });

    it('handles rabbit errors correctly', function (done) {
      this.rabbitClient.sendSync = () =>
        Promise.reject();
      const context = {};

      /**
       * Defines a TwilioService client interface
       * @type {TwilioService}
       */
      const client = RabbitService.getClient(TwilioService, this.rabbitClient, serverMeta);
      expect(client.receiveSms(context))
        .to.eventually.be.rejectedWith(Error, 'could not send message to TWILIO.RECEIVE')
        .and.notify(done);
    });
  });
});

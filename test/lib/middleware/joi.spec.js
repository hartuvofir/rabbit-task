/**
 * Created by asafdavid on 12/03/2017.
 */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import Joi from 'joi';

import { pre } from '../../../src/lib/middleware/joiMiddleware';
import ValidationError from '../../../src/lib/error/validationError';

chai.use(chaiAsPromised);
const expect = chai.expect;
/**
 * Joi schema object for the tests
 */
const testSchema = Joi.object().keys({
  name: Joi.string().required(),
  obj: Joi.object().required(),
});

describe('JoiDecorator', function () {
  describe('pre', function () {
    beforeEach(function () {
      const options = {
        joi: {
          schema: testSchema,
        },
      };
      this.pre = pre.bind({ options });
    });

    it('Return message', function (done) {
      const jsonMsg = {
        content: {
          name: 'Name',
          obj: {
            id: 2,
            comment: 'Hello World',
          },
        },
      };

      const promise = this.pre(jsonMsg);
      expect(promise).to.eventually.be.deep.equal(jsonMsg).notify(done);
    });

    it('Validation error', function (done) {
      const jsonMsg = {
        content: {
          noMame: 'Name',
          obj: {
            id: 2,
            comment: 'Hello World',
          },
        },
      };

      const promise = this.pre(jsonMsg);
      expect(promise).to.eventually.be.rejectedWith(ValidationError).notify(done);
    });

    it('Json Error', function (done) {
      const msg = {
        content: 'Non JSON message',
      };

      const promise = this.pre(msg);
      expect(promise).to.eventually.be.rejectedWith(ValidationError).notify(done);
    });
  });
});

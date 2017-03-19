/**
 * Created by asafdavid on 20/02/2017.
 */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import TwilioService from './twilioService';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('BaseService', function () {
  it('returns handlers', function () {
    expect(TwilioService.prototype._tasks).to.be.an.object;
    expect(TwilioService.prototype._tasks).to.have.all.keys('sendSms', 'receiveSms');
  });
});

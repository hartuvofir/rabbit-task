/**
 * Created by rom on 01/12/16.
 */
/* eslint-disable no-useless-escape */
import { expect } from 'chai';
import Handler from '../../../src/lib/handlers/handler';

describe('Handler', function () {
  describe('Check Match', function () {
    it('String pattern', function () {
      const pattern = 'BKMD.TEST.CREATE';
      const handler = new Handler('name', pattern);

      expect(handler.match('BKMD.TEST.CREATE')).to.be.true;
      expect(handler.match('BKMD.TEST.NEW')).to.be.false;
      expect(handler.match('BKMD.NO_PATTERN.NEW')).to.be.false;
    });

    it('RegEx pattern', function () {
      const pattern = /BKMD[\.]TEST[\.].*/;
      const handler = new Handler('name', pattern);

      expect(handler.match('BKMD.TEST.CREATE')).to.be.true;
      expect(handler.match('BKMD.TEST.NEW')).to.be.true;
      expect(handler.match('BKMD.NO_PATTERN.NEW')).to.be.false;
    });

    it('Dict pattern', function () {
      const topics = {
        'BKMD.TEST.CREATE': {
          A: 'B',
          C: 'D',
        },
        'BKMD.TEST.UPDATE': {
          A: 'B',
          C: 'D',
        },
      };
      const handler = new Handler('name', topics);

      expect(handler.match('BKMD.TEST.CREATE')).to.be.true;
      expect(handler.match('BKMD.TEST.NEW')).to.be.false;
    });

    it('Array pattern', function () {
      const topics = [
        'BKMD.TEST.CREATE',
        'BKMD.TEST.UPDATE',
      ];
      const handler = new Handler('name', topics);

      expect(handler.match('BKMD.TEST.CREATE')).to.be.true;
      expect(handler.match('BKMD.TEST.NEW')).to.be.false;
    });

    it('Everything', function () {
      const handler = new Handler('name', /[\.]/);

      expect(handler.match('BKMD.TEST.CREATE')).to.be.true;
      expect(handler.match('BKMD.TEST.NEW')).to.be.true;
      expect(handler.match('BKMD.NO_PATTERN.NEW')).to.be.true;
    });
  });
});
/* eslint-enable no-useless-escape */

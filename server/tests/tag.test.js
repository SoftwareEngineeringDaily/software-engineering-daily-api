import mongoose from 'mongoose';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, {expect} from 'chai';
import app from '../../index';

chai.config.includeStack = true;

/**
 * root level hooks
 */
after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {};
  mongoose.modelSchemas = {};
  mongoose.connection.close();
  done();
});

xdescribe('## Tag APIs', () => {

  describe('# GET /api/users/:userId', () => {
    it('should get user details', (done) => {
      request(app)
        .get('/api/tags/')
        .expect(httpStatus.OK)
        .then((res) => {
          done();
        })
        .catch(done);
    });

    it('should report error with message - Not found, when tag does not exists', (done) => {
      request(app)
        .get('/api/tags/56c787ccc67fc16ccc1a5e92')
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.message).to.equal('Not Found');
          done();
        })
        .catch(done);
    });
  });

});

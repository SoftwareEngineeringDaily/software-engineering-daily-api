import mongoose from 'mongoose';
import moment from 'moment';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai, {expect} from 'chai';
import app from '../../index';
import Tag from '../models/tag.model';


chai.config.includeStack = true;

function saveMongoArrayPromise(model, dataArray) {
  // this moved later into util file for use by multiple models and tests
  return Promise.all(dataArray.map(data => model(data).save()));
}


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

describe('## Tag APIs', () => {
  describe('# GET /api/tags/:tagId', () => {
    it('should get a tag details', (done) => {
      const tag = new Tag({
        'id': 2
      });
      tag.save()
        .then((tagFound) => { //eslint-disable-line
          return request(app)
            .get(`/api/tags/${tagFound.id}`)
            .expect(httpStatus.OK);
        })
        .then((res) => {  //eslint-disable-line
          done();
        })
        .catch(done);
    });

    it('should report error with message - Not found, when tag does not exists', (done) => {
      request(app)
        .get('/api/tags/123123123')
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.message).to.equal('Not Found');
          done();
        })
        .catch(done);
    });
  });

  describe('# GET /api/tags/', () => {
    before((done) => { //eslint-disable-line
      Tag.remove({}, () => {
        done();
      });
    });

    let firstSet = [];
    const limitNum = 5;
    it('should get all tags', (done) => {
      const tagsArrayPromise = saveMongoArrayPromise(
        Tag,
        new Array(limitNum).fill({}).concat(new Array(limitNum).fill({date: moment().subtract(1, 'minutes')}))
      );
      tagsArrayPromise
        .then((tagFound) => { //eslint-disable-line
          return request(app)
            .get('/api/tags')
            .query({limit: limitNum})
            .expect(httpStatus.OK);
        })
        .then((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(limitNum);
          firstSet = res.body;
          done();
        })
        .catch(done);
    });
  });
});

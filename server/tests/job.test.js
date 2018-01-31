/* eslint-disable no-unused-expressions */

import mongoose from 'mongoose';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import sinon from 'sinon';
import chai, { expect } from 'chai';
import Job from '../models/job.model';
import app from '../../index';
import User from '../models/user.model';

chai.config.includeStack = true;

const fakeJobId = '5a70d375bb869159cd845913';

/**
 * root level hooks
 */
after((done) => {
  mongoose.models = {};
  mongoose.modelSchemas = {};
  mongoose.connection.close();

  done();
});

describe('## Jobs APIs', () => {
  const validAuthorCredentials = {
    username: 'react',
    password: 'express'
  };

  const validReaderCredentials = {
    username: 'react',
    password: 'express'
  };

  let author;
  let authorToken;

  let readerToken;

  before((done) => {
    const register1 = request(app)
      .post('/api/auth/register')
      .send(validAuthorCredentials)
      .expect(httpStatus.CREATED)
      .then((res) => {
        expect(res.body).to.have.property('token');
        authorToken = res.body.token;

        return User.findOne({ username: validAuthorCredentials.username }, (err, found) => {
          author = found;
        });
      });

    const register2 = request(app)
      .post('/api/auth/register')
      .send(validReaderCredentials)
      .expect(httpStatus.CREATED)
      .then((res) => {
        expect(res.body).to.have.property('token');
        readerToken = res.body.token;
      });

    Promise
      .all([register1, register2])
      .then(() => done())
      .catch(() => done());
  });

  after((done) => {
    User.remove({}).exec()
      .then(() => done());
  });

  beforeEach((done) => {
    Job.remove({}).exec()
      .then(() => done());
  });

  describe('# GET /api/jobs', () => {
    it('should get all jobs', (done) => {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author
      });

      job.save()
        .then(newJob =>
          request(app)
            .get('/api/jobs/')
            .expect(httpStatus.OK)
            .then(() => {
              newJob.remove();
              done();
            })
            .catch(() => done()));
    });
  });

  describe('# GET /api/jobs/:jobId', () => {
    it('should get a single job', (done) => {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author
      });

      job.save()
        .then(newJob =>
          request(app)
            .get(`/api/jobs/${newJob._id}`)
            .expect(httpStatus.OK)
            .then((res) => {
              expect(res.body).to.be.an('object');
              newJob.remove();
              done();
            })
            .catch(() => done()));
    });

    it('should return a deleted job for author', (done) => {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author,
        isDeleted: true
      });

      job.save()
        .then(newJob =>
          request(app)
            .get(`/api/jobs/${newJob._id}`)
            .set('Authorization', `Bearer ${authorToken}`)
            .expect(httpStatus.OK)
            .then((res) => {
              expect(res.body).to.be.an('object');
              newJob.remove();
              done();
            })
            .catch(() => done()));
    });

    it('should not return a deleted job for unauthenticated user', (done) => {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author,
        isDeleted: true
      });

      job.save()
        .then(newJob =>
          request(app)
            .get(`/api/jobs/${newJob._id}`)
            .expect(httpStatus.NOT_FOUND)
            .then((res) => {
              expect(res.body).to.be.an('object');
              newJob.remove();
              done();
            })
            .catch(() => done()));
    });

    it('should not return a deleted job for reader', (done) => {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author,
        isDeleted: true
      });

      job.save()
        .then(newJob =>
          request(app)
            .get(`/api/jobs/${newJob._id}`)
            .set('Authorization', `Bearer ${readerToken}`)
            .expect(httpStatus.NOT_FOUND)
            .then((res) => {
              expect(res.body).to.be.an('object');
              newJob.remove();
              done();
            })
            .catch(() => done()));
    });

    it('should not return a job that does not exist', (done) => {
      request(app)
        .get(`/api/jobs/${fakeJobId}`)
        .expect(httpStatus.NOT_FOUND)
        .then(() => done())
        .catch(() => done());
    });
  });

  describe('# POST /api/jobs/:jobId', () => {
    it('should fail creating a job when not authenticated', (done) => {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author
      });

      request(app)
        .post('/api/jobs')
        .send(job)
        .expect(httpStatus.UNAUTHORIZED)
        .then(() => done())
        .catch(() => done());
    });

    it('should create a job', (done) => {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author
      });

      request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authorToken}`)
        .send(job)
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(res.body).to.exist;
          expect(res.body._id).to.exist;

          Job.findByIdAndRemove(res.body._id).exec();

          done();
        })
        .catch(() => done());
    });

    it('should fail creating an invalid job', (done) => {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Intern',
        postedUser: author
      });

      request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authorToken}`)
        .send(job)
        .expect(httpStatus.SERVICE_UNAVAILABLE)
        .then(() => done())
        .catch(() => done());
    });
  });

  describe('# PUT /api/jobs/:jobId', () => {
    it('should update a job', (done) => {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author
      });

      job.save().then(newJob =>
        request(app)
          .put(`/api/jobs/${newJob._id}`)
          .set('Authorization', `Bearer ${authorToken}`)
          .send({
            location: 'Alaska'
          })
          .expect(httpStatus.OK)
          .then((res) => {
            expect(res.body).to.exist;

            Job.findById(newJob._id).then((updatedJob) => {
              expect(updatedJob.location).to.equal('Alaska');
              updatedJob.remove();
              done();
            });
          })
          .catch(() => done()));
    });

    it('should fail updating a job not posted by current user', (done) => {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author
      });

      job.save().then(newJob =>
        request(app)
          .put(`/api/jobs/${newJob._id}`)
          .set('Authorization', `Bearer ${readerToken}`)
          .send({
            location: 'Alaska'
          })
          .expect(httpStatus.UNAUTHORIZED)
          .then(() => {
            newJob.remove();
            done();
          })
          .catch(() => done()));
    });

    it('returns 404 if job does not exist', (done) => {
      request(app)
        .put(`/api/jobs/${fakeJobId}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then(() => done())
        .catch(() => done());
    });

    it('cannot update a deleted job', (done) => {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        isDeleted: true,
        postedUser: author
      });

      job.save().then(newJob =>
        request(app)
          .put(`/api/jobs/${newJob._id}`)
          .set('Authorization', `Bearer ${authorToken}`)
          .send({
            location: 'Alaska'
          })
          .expect(httpStatus.FORBIDDEN)
          .then(() => {
            newJob.remove();
            done();
          })
          .catch(() => done()));
    });
  });

  describe('# DELETE /api/jobs/:jobId', () => {
    it('should delete a job', (done) => {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author
      });

      job.save().then(newJob =>
        request(app)
          .delete(`/api/jobs/${newJob._id}`)
          .set('Authorization', `Bearer ${authorToken}`)
          .expect(httpStatus.OK)
          .then((res) => {
            expect(res.body).to.exist;

            Job.findById(newJob._id).then((deletedJob) => {
              expect(deletedJob.isDeleted).to.equal(true);
              deletedJob.remove();
              done();
            });
          })
          .catch(() => done()));
    });

    it('returns 404 if job does not exist', (done) => {
      request(app)
        .delete(`/api/jobs/${fakeJobId}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then(() => done())
        .catch(() => done());
    });

    it('cannot delete a job not posted by logged in user', (done) => {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author
      });

      job.save().then(newJob =>
        request(app)
          .delete(`/api/jobs/${newJob._id}`)
          .set('Authorization', `Bearer ${readerToken}`)
          .expect(httpStatus.UNAUTHORIZED)
          .then(() => done())
          .catch(() => done()));
    });
  });

  describe('returns errors when findById fails', () => {
    const sandbox = sinon.sandbox.create();

    beforeEach(() => {
      sandbox.mock(Job)
        .expects('findById')
        .yields(new Error(), null);
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('raises an error on getting job', (done) => {
      request(app)
        .get(`/api/jobs/${fakeJobId}`)
        .expect(httpStatus.SERVICE_UNAVAILABLE)
        .then(() => done())
        .catch(() => done());
    });

    it('raises an error on deleting job', (done) => {
      request(app)
        .delete(`/api/jobs/${fakeJobId}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .expect(httpStatus.SERVICE_UNAVAILABLE)
        .then(() => done())
        .catch(() => done());
    });

    it('raises an error on updating a job', (done) => {
      request(app)
        .put(`/api/jobs/${fakeJobId}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .expect(httpStatus.SERVICE_UNAVAILABLE)
        .then(() => done())
        .catch(() => done());
    });
  });
});

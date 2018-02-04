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
      .catch(err => done(err));
  });

  after(() => User.remove({}));
  beforeEach(() => Job.remove({}));

  const createJob = (isDeleted = false) => {
    const job = new Job({
      companyName: 'FooBar Inc',
      applicationEmailAddress: 'foo@bar.com',
      location: 'Bermuda',
      title: 'Senior Developer',
      description: 'Coding wizard required',
      employmentType: 'Permanent',
      postedUser: author,
      isDeleted
    });

    return job.save();
  };

  describe('# GET /api/jobs', () => {
    it('should get all jobs', () =>
      createJob()
        .then(() =>
          request(app)
            .get('/api/jobs/')
            .expect(httpStatus.OK)));

    it('should not return deleted jobs', () => {
      const job1 = new Job({
        companyName: 'BarFoo Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Alaska',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author
      });

      const job2 = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author,
        isDeleted: true
      });

      return Promise.all([
        job1.save(),
        job2.save()
      ])
        .then(() =>
          request(app)
            .get('/api/jobs/')
            .expect(httpStatus.OK)
            .then((res) => {
              expect(res.body).to.be.an('array');
              expect(res.body.length).to.equal(1);
              expect(res.body[0].location).to.equal('Alaska');
            }));
    });
  });

  describe('# GET /api/jobs/:jobId', () => {
    it('should get a single job', () =>
      createJob()
        .then(newJob =>
          request(app)
            .get(`/api/jobs/${newJob._id}`)
            .expect(httpStatus.OK)));

    it('should return a deleted job for author', () =>
      createJob(true)
        .then(newJob =>
          request(app)
            .get(`/api/jobs/${newJob._id}`)
            .set('Authorization', `Bearer ${authorToken}`)
            .expect(httpStatus.OK)));

    it('should not return a deleted job for unauthenticated user', () =>
      createJob(true)
        .then(newJob =>
          request(app)
            .get(`/api/jobs/${newJob._id}`)
            .expect(httpStatus.NOT_FOUND)));

    it('should not return a deleted job for reader', () =>
      createJob(true)
        .then(newJob =>
          request(app)
            .get(`/api/jobs/${newJob._id}`)
            .set('Authorization', `Bearer ${readerToken}`)
            .expect(httpStatus.NOT_FOUND)));

    it('should not return a job that does not exist', () =>
      request(app)
        .get(`/api/jobs/${fakeJobId}`)
        .expect(httpStatus.NOT_FOUND));
  });

  describe('# POST /api/jobs/:jobId', () => {
    it('should fail creating a job when not authenticated', () => {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author
      });

      return request(app)
        .post('/api/jobs')
        .send(job)
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should create a job', () => {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author
      });

      return request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authorToken}`)
        .send(job)
        .expect(httpStatus.CREATED);
    });

    it('should fail creating an invalid job', () => {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Intern',
        postedUser: author
      });

      return request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authorToken}`)
        .send(job)
        .expect(httpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('# PUT /api/jobs/:jobId', () => {
    it('should update a job', () =>
      createJob()
        .then(newJob =>
          request(app)
            .put(`/api/jobs/${newJob._id}`)
            .set('Authorization', `Bearer ${authorToken}`)
            .send({
              location: 'Alaska'
            })
            .expect(httpStatus.OK)
            .then((res) => {
              expect(res.body).to.exist;

              return Job.findById(newJob._id).then((updatedJob) => {
                expect(updatedJob.location).to.equal('Alaska');
              });
            })));

    it('should fail updating a job not posted by current user', () =>
      createJob()
        .then(newJob =>
          request(app)
            .put(`/api/jobs/${newJob._id}`)
            .set('Authorization', `Bearer ${readerToken}`)
            .send({
              location: 'Alaska'
            })
            .expect(httpStatus.UNAUTHORIZED)));

    it('returns 404 if job does not exist', () =>
      request(app)
        .put(`/api/jobs/${fakeJobId}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .expect(httpStatus.NOT_FOUND));

    it('cannot update a deleted job', () =>
      createJob(true)
        .then(newJob =>
          request(app)
            .put(`/api/jobs/${newJob._id}`)
            .set('Authorization', `Bearer ${authorToken}`)
            .send({
              location: 'Alaska'
            })
            .expect(httpStatus.FORBIDDEN)));
  });

  describe('# DELETE /api/jobs/:jobId', () => {
    it('should delete a job', () =>
      createJob()
        .then(newJob =>
          request(app)
            .delete(`/api/jobs/${newJob._id}`)
            .set('Authorization', `Bearer ${authorToken}`)
            .expect(httpStatus.OK)
            .then((res) => {
              expect(res.body).to.exist;

              return Job.findById(newJob._id).then((deletedJob) => {
                expect(deletedJob.isDeleted).to.equal(true);
              });
            })));

    it('returns 404 if job does not exist', () =>
      request(app)
        .delete(`/api/jobs/${fakeJobId}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .expect(httpStatus.NOT_FOUND));

    it('cannot delete a job not posted by logged in user', () =>
      createJob()
        .then(newJob =>
          request(app)
            .delete(`/api/jobs/${newJob._id}`)
            .set('Authorization', `Bearer ${readerToken}`)
            .expect(httpStatus.UNAUTHORIZED)));
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

    it('raises an error on getting job', () =>
      request(app)
        .get(`/api/jobs/${fakeJobId}`)
        .expect(httpStatus.INTERNAL_SERVER_ERROR));

    it('raises an error on deleting job', () =>
      request(app)
        .delete(`/api/jobs/${fakeJobId}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .expect(httpStatus.INTERNAL_SERVER_ERROR));

    it('raises an error on updating a job', () =>
      request(app)
        .put(`/api/jobs/${fakeJobId}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .expect(httpStatus.INTERNAL_SERVER_ERROR));
  });
});

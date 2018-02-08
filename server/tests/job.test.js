/* eslint-disable no-unused-expressions */

import mongoose from 'mongoose';
import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import sinon from 'sinon';
import chai, { expect } from 'chai';
import Job from '../models/job.model';
import app from '../../index';
import User from '../models/user.model';
import sgMail from '../helpers/mail';

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
    username: 'author',
    password: 'express'
  };

  const validReaderCredentials = {
    username: 'reader',
    password: 'express'
  };

  let author;
  let authorToken;

  let readerToken;

  before(async function () {
    const response1 = await request(app)
      .post('/api/auth/register')
      .send(validAuthorCredentials);

    expect(response1.statusCode).to.equal(httpStatus.CREATED);
    expect(response1.body).to.have.property('token');

    authorToken = response1.body.token;
    author = await User.findOne({ username: validAuthorCredentials.username });

    const response2 = await request(app)
      .post('/api/auth/register')
      .send(validReaderCredentials);

    expect(response2.statusCode).to.equal(httpStatus.CREATED);
    expect(response2.body).to.have.property('token');

    readerToken  = response2.body.token;
  });

  after(() => User.remove({}));
  beforeEach(() => Job.remove({}));

  const createJob = async function (isDeleted = false) {
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

    return await job.save();
  };

  const createExpiredJob = async function () {
    const yesterday = new Date().getDate() - 1;

    const job = new Job({
      companyName: 'BarFoo Inc',
      applicationEmailAddress: 'foo@bar.com',
      location: 'Alaska',
      title: 'Senior Developer',
      description: 'Coding wizard required',
      employmentType: 'Permanent',
      expirationDate: yesterday,
      postedUser: author
    });

    return await job.save();
  }

  describe('# GET /api/jobs', () => {
    it('should get all jobs', async function () {
      await createJob();
      const response = await request(app)
        .get('/api/jobs/');

      expect(response.statusCode).to.equal(httpStatus.OK);
    });

    it('should not return deleted jobs', async function () {
      const job1 = await new Job({
        companyName: 'BarFoo Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Alaska',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author
      }).save();

      const job2 = await new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author,
        isDeleted: true
      }).save();

      const response = await request(app)
        .get('/api/jobs/');

      expect(response.statusCode).to.equal(httpStatus.OK);
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.equal(1);
      expect(response.body[0].location).to.equal('Alaska');
    });

    it('should not return expired jobs', async function () {
      const job1 = await new Job({
        companyName: 'BarFoo Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Alaska',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author
      }).save();

      const yesterday = new Date().getDate() - 1;

      const job2 = await new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author,
        expirationDate: yesterday
      }).save();

      const response = await request(app)
        .get('/api/jobs/');

      expect(response.statusCode).to.equal(httpStatus.OK);
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.equal(1);
      expect(response.body[0].location).to.equal('Alaska');
    });
  });

  describe('# GET /api/jobs/:jobId', () => {
    it('should get a single job', async function () {
      const newJob = await createJob();
      const response = await request(app)
        .get(`/api/jobs/${newJob._id}`);

      expect(response.statusCode).to.equal(httpStatus.OK);
    });

    it('should return a deleted job for author', async function () {
      const newJob = await createJob(true);
      const response = await request(app)
        .get(`/api/jobs/${newJob._id}`)
        .set('Authorization', `Bearer ${authorToken}`);

      expect(response.statusCode).to.equal(httpStatus.OK);
    });

    it('should not return a deleted job for unauthenticated user', async function () {
      const newJob = await createJob(true);
      const response = await request(app)
        .get(`/api/jobs/${newJob._id}`);

      expect(response.statusCode).to.equal(httpStatus.NOT_FOUND);
    });

    it('should not return a deleted job for reader', async function () {
      const newJob = await createJob(true);
      const response = await request(app)
        .get(`/api/jobs/${newJob._id}`)
        .set('Authorization', `Bearer ${readerToken}`);

      expect(response.statusCode).to.equal(httpStatus.NOT_FOUND);
    });

    it('should not return an expired job for reader', async function () {
      const newJob = await createExpiredJob();
      const response = await request(app)
        .get(`/api/jobs/${newJob._id}`)
        .set('Authorization', `Bearer ${readerToken}`);

      expect(response.statusCode).to.equal(httpStatus.NOT_FOUND);
    });

    it('should not return an expired job for unauthorized user', async function () {
      const newJob = await createExpiredJob();
      const response = await request(app)
        .get(`/api/jobs/${newJob._id}`);

      expect(response.statusCode).to.equal(httpStatus.NOT_FOUND);
    });

    it('should return an expired job for author', async function () {
      const newJob = await createExpiredJob();
      const response = await request(app)
        .get(`/api/jobs/${newJob._id}`)
        .set('Authorization', `Bearer ${authorToken}`);

      expect(response.statusCode).to.equal(httpStatus.OK);
    });

    it('should not return a job that does not exist', async function () {
      const response = await request(app)
        .get(`/api/jobs/${fakeJobId}`);

      expect(response.statusCode).to.equal(httpStatus.NOT_FOUND);
    });
  });

  describe('# POST /api/jobs/:jobId', () => {
    it('should fail creating a job when not authenticated', async function () {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author
      });

      const response = await request(app)
        .post('/api/jobs')
        .send(job);

      expect(response.statusCode).to.equal(httpStatus.UNAUTHORIZED);
    });

    it('should create a job', async function () {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Permanent',
        postedUser: author
      });

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authorToken}`)
        .send(job);

      expect(response.statusCode).to.equal(httpStatus.CREATED);
    });

    it('should fail creating an invalid job', async function () {
      const job = new Job({
        companyName: 'FooBar Inc',
        applicationEmailAddress: 'foo@bar.com',
        location: 'Bermuda',
        title: 'Senior Developer',
        description: 'Coding wizard required',
        employmentType: 'Intern',
        postedUser: author
      });

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authorToken}`)
        .send(job);

      expect(response.statusCode).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('# PUT /api/jobs/:jobId', () => {
    it('should update a job', async function () {
      const newJob = await createJob();
      const response = await request(app)
        .put(`/api/jobs/${newJob._id}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          location: 'Alaska'
        });

      expect(response.statusCode).to.equal(httpStatus.OK);

      const updatedJob = await Job.findById(newJob._id);
      expect(updatedJob.location).to.equal('Alaska');
    });

    it('should fail updating a job not posted by current user', async function () {
      const newJob = await createJob();
      const response = await request(app)
        .put(`/api/jobs/${newJob._id}`)
        .set('Authorization', `Bearer ${readerToken}`)
        .send({
          location: 'Alaska'
        });

      expect(response.statusCode).to.equal(httpStatus.UNAUTHORIZED);
    });

    it('returns 404 if job does not exist', async function () {
      const newJob = await createJob();
      const response = await request(app)
        .put(`/api/jobs/${fakeJobId}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          location: 'Alaska'
        });

      expect(response.statusCode).to.equal(httpStatus.NOT_FOUND);
    });

    it('cannot update a deleted job', async function () {
      const newJob = await createJob(true);
      const response = await request(app)
        .put(`/api/jobs/${newJob._id}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          location: 'Alaska'
        });

      expect(response.statusCode).to.equal(httpStatus.FORBIDDEN);
    });

    it('cannot update an expired job', async function () {
      const newJob = await createExpiredJob();
      const response = await request(app)
        .put(`/api/jobs/${newJob._id}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          location: 'Alaska'
        });

      expect(response.statusCode).to.equal(httpStatus.FORBIDDEN);
    });
  });

  describe('# DELETE /api/jobs/:jobId', () => {
    it('should delete a job', async function () {
      const newJob = await createJob();
      const response = await request(app)
        .delete(`/api/jobs/${newJob._id}`)
        .set('Authorization', `Bearer ${authorToken}`);

      expect(response.statusCode).to.equal(httpStatus.OK);
      expect(response.body).to.exist;

      const deletedJob = await Job.findById(newJob._id);
      expect(deletedJob.isDeleted).to.equal(true);
    });

    it('returns 404 if job does not exist', async function () {
      const newJob = await createJob();
      const response = await request(app)
        .delete(`/api/jobs/${fakeJobId}`)
        .set('Authorization', `Bearer ${authorToken}`);

      expect(response.statusCode).to.equal(httpStatus.NOT_FOUND);
    });

    it('cannot delete a job not posted by logged in user', async function () {
      const newJob = await createJob();
      const response = await request(app)
        .delete(`/api/jobs/${newJob._id}`)
        .set('Authorization', `Bearer ${readerToken}`);

      expect(response.statusCode).to.equal(httpStatus.UNAUTHORIZED);
    });
  });

  describe('# POST /api/jobs/:jobId/apply', () => {
    it('should fail applying for a job that does not exist', async function () {
      const response = await request(app)
        .post(`/api/jobs/${fakeJobId}/apply`)
        .set('Authorization', `Bearer ${readerToken}`);

      expect(response.statusCode).to.equal(httpStatus.NOT_FOUND);
    });

    it('should fail applying for a job when not logged in', async function () {
      const response = await request(app)
        .post(`/api/jobs/${fakeJobId}/apply`);

      expect(response.statusCode).to.equal(httpStatus.UNAUTHORIZED);
    });

    it('should fail applying for a deleted job', async function () {
      const newJob = await createJob(true);

      const response = await request(app)
        .post(`/api/jobs/${fakeJobId}/apply`)
        .set('Authorization', `Bearer ${readerToken}`)
        .send();

      expect(response.statusCode).to.equal(httpStatus.NOT_FOUND);
    });

    it('should fail applying for an expired job', async function () {
      const newJob = await createExpiredJob();

      const response = await request(app)
        .post(`/api/jobs/${fakeJobId}/apply`)
        .set('Authorization', `Bearer ${readerToken}`)
        .send();

      expect(response.statusCode).to.equal(httpStatus.NOT_FOUND);
    });

    it('should fail applying for a job posted by same user', async function () {
      const newJob = await createJob();

      const response = await request(app)
        .post(`/api/jobs/${newJob._id}/apply`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send();

      expect(response.statusCode).to.equal(httpStatus.FORBIDDEN);
    });

    it('should fail applying for a job when covering letter not supplied', async function () {
      const newJob = await createJob();

      const response = await request(app)
        .post(`/api/jobs/${newJob._id}/apply`)
        .set('Authorization', `Bearer ${readerToken}`)
        .attach('resume', 'server/tests/attachments/sample.pdf');

      expect(response.statusCode).to.equal(httpStatus.BAD_REQUEST);
    });

    it('should fail applying for a job when resume not supplied', async function () {
      const newJob = await createJob();

      const response = await request(app)
        .post(`/api/jobs/${newJob._id}/apply`)
        .set('Authorization', `Bearer ${readerToken}`)
        .send({
          coveringLetter: 'bar'
        });

      expect(response.statusCode).to.equal(httpStatus.BAD_REQUEST);
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

    it('raises an error on getting job', async function () {
      const response = await request(app)
        .get(`/api/jobs/${fakeJobId}`);
      expect(response.statusCode).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
    });

    it('raises an error on deleting a job', async function () {
      const response = await request(app)
        .delete(`/api/jobs/${fakeJobId}`)
        .set('Authorization', `Bearer ${authorToken}`);

      expect(response.statusCode).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
    });

    it('raises an error on applying for a job', async function () {
      const response = await request(app)
        .post(`/api/jobs/${fakeJobId}/apply`)
        .set('Authorization', `Bearer ${readerToken}`);

      expect(response.statusCode).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
    });

    it('raises an error on updating a job', async function () {
      const response = await request(app)
        .put(`/api/jobs/${fakeJobId}`)
        .set('Authorization', `Bearer ${authorToken}`);

      expect(response.statusCode).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});

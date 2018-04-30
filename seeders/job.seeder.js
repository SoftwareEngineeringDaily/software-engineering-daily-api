import { Seeder } from 'mongoose-data-seed';
import Mongoose from 'mongoose';
import Job from '../server/models/job.model';

const userId = Mongoose.mongo.ObjectId('4eb6e7e7e9b7f4194e000001');
const data = [{
  companyName: 'new company',
  applicationEmailAddress: 'hr@newcompany.co',
  location: 'remote',
  title: 'Job Title',
  description: 'details of the new job',
  employmentType: 'Permanent',
  remoteWorkingConsidered: true,
  postedUser: userId,
  postedDate: '2018-04-20'
}, {
  companyName: 'SEDaily',
  applicationEmailAddress: 'hr@sedaily.com',
  location: 'york',
  title: 'Job Title',
  description: 'details of the new job',
  employmentType: 'Contract',
  postedUser: userId,
  postedDate: '2018-04-20',
  expirationDate: '2019-01-01',
  isDeleted: true
}];
/* eslint-disable  class-methods-use-this */
class JobSeeder extends Seeder {
  async shouldRun() {
    return Job.count().exec().then(count => count === 0);
  }

  async run() {
    return Job.create(data);
  }
}

export default JobSeeder;

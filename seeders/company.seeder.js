import { Seeder } from 'mongoose-data-seed';
import Mongoose from 'mongoose';
import Company from '../server/models/company.model';

const userId = Mongoose.mongo.ObjectId('4eb6e7e7e9b7f4194e000001');
const data = [{
  companyName: 'Software Engineering Radio',
  imageUrl: 'https://dummyimage.com/300x300.jpg',
  externalUrl: 'externalUrl',
  localUrl: 'softwaredaily.com/localUrl',
  author: userId,
  dateCreated: '2018-04-20 10:30:58.140Z'
}, {
  companyName: 'Software Engineering Daily',
  imageUrl: 'https://dummyimage.com/300x300.jpg',
  externalUrl: 'externalUrl',
  localUrl: 'softwaredaily.com/sed',
  author: userId,
  dateCreated: '2018-04-20 10:30:58.140Z'
}, {
  companyName: 'new company',
  imageUrl: 'https://dummyimage.com/300x300.jpg',
  externalUrl: 'externalUrl',
  localUrl: 'softwaredaily.com/sed',
  description: 'A new company that does stuff',
  isDeleted: true,
  isPublic: true,
  author: userId,
  dateCreated: '2018-04-20 10:30:58.140Z'
}];
/* eslint-disable  class-methods-use-this */
class CompanySeeder extends Seeder {
  async shouldRun() {
    return Company.count().exec().then(count => count === 0);
  }

  async run() {
    return Company.create(data);
  }
}

export default CompanySeeder;

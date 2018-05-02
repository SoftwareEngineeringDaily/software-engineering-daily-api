import { Seeder } from 'mongoose-data-seed';
import Mongoose from 'mongoose';
import Model from '../server/models/user.model';

const data = [{
  _id: Mongoose.mongo.ObjectId('4eb6e7e7e9b7f4194e000001'),
  username: 'user',
  email: 'user@email.com',
  name: 'Software Dev',
  password: 'express'
}, {
  username: 'user2',
  email: 'user2@email.com',
  name: 'User 2',
  bio: 'a budding software dev',
  password: 'express',
  website: 'www.user.com',
  signedupForNewsletter: false
}, {
  username: 'user3',
  email: 'user3@email.com',
  name: 'User 3',
  bio: 'software developer',
  password: 'password',
  verified: true,
  createdAt: '12/12/14',
  signedupForNewsletter: true
}];
/* eslint-disable  class-methods-use-this */
class UsersSeeder extends Seeder {
  async shouldRun() {
    return Model.count()
      .exec()
      .then(count => count === 0);
  }

  async run() {
    return Model.create(data);
  }
}

export default UsersSeeder;

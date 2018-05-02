import { Seeder } from 'mongoose-data-seed';
import Mongoose from 'mongoose';
import Model from '../server/models/forumThread.model';

const data = [{
  score: 2,
  title: 'FAQ',
  content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  deleted: false,
  author: Mongoose.mongo.ObjectId('4eb6e7e7e9b7f4194e000001'),
  commentsCount: 0,
  dateLastAcitiy: '2018-02-15',
  dateCreated: '2018-01-01'
}, {
  score: 0,
  title: 'Welcome to the Software Daily forum!',
  content: 'Who are you? What software do you work on?',
  deleted: false,
  author: Mongoose.mongo.ObjectId('4eb6e7e7e9b7f4194e000001'),
  commentsCount: 69,
  dateLastAcitiy: '2018-04-20',
  dateLastEdited: '2018-01-01',
  dateCreated: '2018-04-20',
}, {
  _id: Mongoose.mongo.ObjectId('5a57a41a34325b917b246286'),
  score: 3,
  title: 'Discuss: IPFS Design with David Dias',
  content: 'IPFS Design with David Dias',
  deleted: true,
  podcastEpisode: Mongoose.mongo.ObjectId('5a57a41934325b917b24627d'),
  author: Mongoose.mongo.ObjectId('4eb6e7e7e9b7f4194e000001'),
  commentsCount: 2,
  dateLastAcitiy: '2018-04-27',
  dateLastEdited: '2018-05-01',
  dateCreated: '2018-04-27',
}];
/* eslint-disable  class-methods-use-this */
class ForumThreadSeeder extends Seeder {
  async shouldRun() {
    return Model.count()
      .exec()
      .then(count => count === 0);
  }

  async run() {
    return Model.create(data);
  }
}

export default ForumThreadSeeder;

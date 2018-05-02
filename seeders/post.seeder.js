import { Seeder } from 'mongoose-data-seed';
import Mongoose from 'mongoose';
import Model from '../server/models/post.model';

const data = [{
  _id: Mongoose.mongo.ObjectId('5a57a41934325b917b24627d'),
  score: 1,
  totalFavorites: 0,
  title: 'IPFS Design with David Dias',
  thread: Mongoose.mongo.ObjectId('5a57a41a34325b917b246286'),
  content: '"<!--powerpress_player--><div class="powerpress_player" id="powerpress_player_8917"...',
  date: '2017-12-28T10:00:42.000Z',
}, {
  score: 20,
  title: 'Language Design with Brian Kernighan Holiday Repeat',
  content: '"<!--powerpress_player--><div class="powerpress_player" id="powerpress_player_8917"...',
  date: '2018-01-28T10:00:42.000Z',
}, {
  score: 2,
  title: 'API Design Standards with Andy Beier',
  content: '"<!--powerpress_player--><div class="powerpress_player" id="powerpress_player_8917"...',
  date: '2017-04-05',
}, {
  _id: Mongoose.mongo.ObjectId('5913c0b64ee01db33caccf8e'),
  score: 0,
  title: 'Erlang Systems Design with Francesco Cesarini',
  content: '"<!--powerpress_player--><div class="powerpress_player" id="powerpress_player_8917"...',
  date: '2016-05-22T21:36:34',
}];
/* eslint-disable  class-methods-use-this */
class PostSeeder extends Seeder {
  async shouldRun() {
    return Model.count()
      .exec()
      .then(count => count === 0);
  }

  async run() {
    return Model.create(data);
  }
}

export default PostSeeder;

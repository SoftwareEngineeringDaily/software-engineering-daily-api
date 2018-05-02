import mongooseLib from 'mongoose';
import Users from './seeders/users.seeder';
import Company from './seeders/company.seeder';
import Job from './seeders/job.seeder';
import ForumThread from './seeders/forum-thread.seeder';
import Post from './seeders/post.seeder';

mongooseLib.Promise = global.Promise;

// Export the mongoose lib
export const mongoose = mongooseLib;

// Export the mongodb url
export const mongoURL = process.env.MONGO_HOST || 'mongodb://localhost:27017/sed';

/*
  Seeders List
  ------
  order is important
*/
export const seedersList = {
  Users,
  Company,
  Job,
  Post,
  ForumThread,
};

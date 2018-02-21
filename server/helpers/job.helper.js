import { pick } from 'lodash';

const fieldsForAuthor = [
  '_id',
  'companyName',
  'applicationEmailAddress',
  'location',
  'title',
  'description',
  'tags',
  'employmentType',
  'remoteWorkingConsidered',
  'postedUser',
  'postedDate',
  'expirationDate',
  'isDeleted'
];

const fieldsForReader = [
  '_id',
  'companyName',
  'location',
  'title',
  'description',
  'tags',
  'employmentType',
  'remoteWorkingConsidered',
  'postedDate'
];

export default function transform(job, isAuthor) {
  return pick(job, isAuthor ? fieldsForAuthor : fieldsForReader);
}

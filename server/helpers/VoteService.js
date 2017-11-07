import Vote from '../models/vote.model';

let VoteService = {};

VoteService.createFromEntity = function (entity, user) {
  let newvote = new Vote();
  newvote.entityId = entity._id;
  newvote.userId = user._id;
  newvote.direction = 'upvote'; // @TODO: Make constant
  return newvote;
};

module.exports = VoteService;

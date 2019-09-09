#!/bin/bash

if [ -f .env ]; then
	echo ".env file found in devops directory. Using testing environment variables..."
	source .env
fi

DOCKER_IMAGE="softwaredaily/sedaily-mongo"

function dumpDatabase() {
	mongodump --quiet  --host $MONGO_CI_HOST --port $MONGO_CI_PORT --username $MONGO_CI_USER --password $MONGO_CI_PASS -d $MONGO_CI_DB --excludeCollection users --excludeCollection passwordresets --excludeCollection forumthreads --excludeCollection forumthreadsCI --out ./backup
}

function dumpAdminUser() {
	mongodump --quiet  --host $MONGO_CI_HOST --username $MONGO_CI_USER --password $MONGO_CI_PASS --port $MONGO_CI_PORT -d $MONGO_CI_DB --collection users --query '{ email: { $eq: "forum_admin@softwaredaily.com" } }' --out ./backup
}

function dumpForumThreads() {
	# remove all documents from forumthreadsCI collection
	tmpFile=$(mktemp)
	echo -e "use ${MONGO_CI_DB};\ndb.forumthreadsCI.remove({});" > ${tmpFile}
	mongo --quiet --host ${MONGO_CI_HOST} --port ${MONGO_CI_PORT} --username ${MONGO_CI_USER} --password ${MONGO_CI_PASS} --authenticationDatabase ${MONGO_CI_DB} <${tmpFile}
	rm ${tmpFile}

	# copy all documents from forumThreads collection to forumThreadsCI collection
	mongodump --quiet  --host $MONGO_CI_HOST --port $MONGO_CI_PORT --username $MONGO_CI_USER --password $MONGO_CI_PASS -d $MONGO_CI_DB -c forumthreads --out ./forumthreads
	mongorestore --quiet  --host $MONGO_CI_HOST --port $MONGO_CI_PORT --username $MONGO_CI_USER --password $MONGO_CI_PASS -d $MONGO_CI_DB -c forumthreadsCI ./forumthreads/${MONGO_CI_DB}/forumthreads.bson
	rm -rf forumthreads

	# set all authors to admin
	tmpFile=$(mktemp)
	echo -e "use ${MONGO_CI_DB};\ndb.forumthreadsCI.updateMany({}, {\$set: {author: ObjectId(\"5bf2d291955b3910513537ad\")}});" > ${tmpFile}
	mongo --quiet --host ${MONGO_CI_HOST} --port ${MONGO_CI_PORT} --username ${MONGO_CI_USER} --password ${MONGO_CI_PASS} --authenticationDatabase ${MONGO_CI_DB} <${tmpFile}
	rm ${tmpFile}

	# dump forumThreadsCI to forumthreads collection locally
	mongodump --quiet --host $MONGO_CI_HOST --port $MONGO_CI_PORT --username $MONGO_CI_USER --password $MONGO_CI_PASS -d $MONGO_CI_DB -c forumthreadsCI --out ./backup
	mv backup/${MONGO_CI_DB}/forumthreadsCI.bson backup/${MONGO_CI_DB}/forumthreads.bson
	mv backup/${MONGO_CI_DB}/forumthreadsCI.metadata.json backup/${MONGO_CI_DB}/forumthreads.metadata.json
}


dumpDatabase
dumpAdminUser
dumpForumThreads

mkdir dump/
mv backup/$MONGO_CI_DB/* dump/
rm -rf backup

docker build -f mongo.Dockerfile -t $DOCKER_IMAGE . --no-cache

rm -rf dump

# must be part the organization
echo $DOCKER_PASSWORD | docker login -u "$DOCKER_USERNAME" --password-stdin

docker push $DOCKER_IMAGE

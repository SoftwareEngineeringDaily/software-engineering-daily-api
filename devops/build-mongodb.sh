#!/bin/bash

if [ -f .env ]; then
	echo ".env file found in devops directory. Using testing environment variables..."
	source .env
fi

if [[ -z $1 ]]; then
	TAG="develop"
else
	TAG=$1
fi

DOCKER_IMAGE="softwaredaily/sedaily-mongo:$TAG"

mongodump --host $MONGO_CI_HOST --port $MONGO_CI_PORT --username $MONGO_CI_USER --password $MONGO_CI_PASS -d $MONGO_CI_DB --excludeCollection users --out ./backup

mongodump --host $MONGO_CI_HOST --username $MONGO_CI_USER --password $MONGO_CI_PASS --port $MONGO_CI_PORT -d $MONGO_CI_DB --collection users --query '{ email: { $eq: "forum_admin@softwaredaily.com" } }' --out ./backup

mkdir dump/
mv backup/$MONGO_CI_DB/* dump/
rm -rf $MONGO_CI_DB

docker build -f mongo.Dockerfile -t $DOCKER_IMAGE . --no-cache

rm -rf dump

# must be part the organization
echo $DOCKER_PASSWORD | docker login -u "$DOCKER_USERNAME" --password-stdin

docker push $DOCKER_IMAGE

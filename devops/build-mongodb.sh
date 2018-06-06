#!/bin/bash

if [[ -z $1 ]]; then
	TAG="develop"
else
	TAG=$1
fi

DOCKER_IMAGE="softwaredaily/sedaily-mongo:$TAG"

mongodump --host $MONGO_CI_HOST --username $MONGO_CI_USER --password $MONGO_CI_PASS --port $MONGO_CI_PORT -d $MONGO_CI_DB --out ./backup

mkdir dump/
mv backup/$MONGO_CI_DB/* dump/
rm -rf $MONGO_CI_DB

docker build -f mongo.Dockerfile -t $DOCKER_IMAGE . --no-cache

rm -rf dump

# must be part the organization
echo $DOCKER_PASSWORD | docker login -u "$DOCKER_USERNAME" --password-stdin

docker push $DOCKER_IMAGE

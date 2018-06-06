#!/bin/bash

. test.sh

DOCKER_IMAGE="softwaredaily/sedaily-mongo:develop"

docker run --rm -v "`pwd`/backup:/opt/backup" mongo:3.4.10 bash -c "mongodump --host $MONGO_HOST --username $MONGO_USER --password $MONGO_PASS --port $MONGO_PORT -d $MONGO_DB --out /opt/backup"

mkdir dump/
mv backup/$MONGO_DB/* dump/
rm -rf $MONGO_DB

docker build -f mongo.Dockerfile -t $DOCKER_IMAGE . --no-cache

rm -rf dump

# must be part the organization
echo $DOCKER_PASSWORD | docker login -u "$DOCKER_USERNAME" --password-stdin

docker push $DOCKER_IMAGE

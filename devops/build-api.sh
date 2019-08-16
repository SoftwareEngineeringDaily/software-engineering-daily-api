#!/bin/bash
# builds sedaiy-rest-api image for Continuous Integration (CI) purposes


echo "Building API Docker image"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_DIR=$(dirname $DIR)

DOCKER_IMAGE="softwaredaily/sedaily-rest-api"

# copy docker file to repo root
cp $DIR/ci.Dockerfile $REPO_DIR/ci.Dockerfile

docker build -f $REPO_DIR/ci.Dockerfile -t $DOCKER_IMAGE $REPO_DIR #--no-cache

rm $REPO_DIR/ci.Dockerfile

# must be part the organization
echo $DOCKER_PASSWORD | docker login -u "$DOCKER_USERNAME" --password-stdin

docker push $DOCKER_IMAGE

#!/bin/bash
# builds sedaiy-rest-api image for Continuous Integration (CI) purposes

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_DIR=$(dirname $DIR)

# copy docker file to repo root
cp $DIR/ci.Dockerfile $REPO_DIR/ci.Dockerfile

docker build -f $REPO_DIR/ci.Dockerfile -t softwaredaily/sedaily-rest-api $REPO_DIR

rm $REPO_DIR/ci.Dockerfile

# docker login #must be part of organization
# docker push softwaredaily/sedaily-rest-api

#!/bin/bash

MONGO_DB="heroku_j871nx6h"

# download the latest backup from MongoDB
curl -Ls -O https://s3-us-west-2.amazonaws.com/sedaily-mongo-backup/$MONGO_DB.tar.gz

# unpack and move the dump to the right directory
tar -zxf $MONGO_DB.tar.gz
mkdir dump/
mv $MONGO_DB/* dump/
rmdir $MONGO_DB
rm $MONGO_DB.tar.gz

docker build -f mongo.Dockerfile -t softwaredaily/sedaily-mongo . --no-cache

rm -rf dump

#docker push softwaredaily/sedaily-mongo

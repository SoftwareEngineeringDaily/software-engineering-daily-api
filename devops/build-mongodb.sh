#!/bin/bash

if [ -z "$MONGO_DB" ]; then
	echo "MONGO_DB environment variable must be set. This should be the database you want to download from the sedaily-mongo-backup S3 bucket."
	exit 1
fi

# download the latest backup from MongoDB
curl -Ls -O https://s3-us-west-2.amazonaws.com/sedaily-mongo-backup/$MONGO_DB.tar.gz

# unpack and move the dump to the right directory
tar -zxf $MONGO_DB.tar.gz
mkdir dump/
mv $MONGO_DB/* dump/
rmdir $MONGO_DB
rm $MONGO_DB.tar.gz

docker build -f mongo.Dockerfile -t andrewlloyd/sedaily-mongo .

docker push andrewlloyd/sedaily-mongo

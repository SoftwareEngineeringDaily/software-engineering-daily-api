#!/bin/bash


#curl -L -o out.tar https://www.dropbox.com/s/tztc7z4mngp7pbb/db-backup.tar?dl=1

docker build -f mongo.Dockerfile -t andrewlloyd/sedaily-mongo .


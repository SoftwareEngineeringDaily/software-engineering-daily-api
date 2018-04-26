# https://stackoverflow.com/questions/39282957/mongorestore-in-a-dockerfile
FROM mongo:3.4.10

RUN apt-get update -y; apt-get install wget unzip -y

RUN wget --quiet https://s3-us-west-2.amazonaws.com/sedaily-mongo-backup/heroku_j871nx6h.zip

RUN mkdir -p /home/dump/sedaily-mongo
RUN unzip heroku_j871nx6h.zip -d /home/dump/sedaily-mongo

#COPY dump /home/dump
COPY mongo.sh /home/mongo.sh
RUN chmod 777 /home/mongo.sh
CMD /home/mongo.sh

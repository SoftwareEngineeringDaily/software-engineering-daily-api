# https://stackoverflow.com/questions/39282957/mongorestore-in-a-dockerfile
FROM mongo:3.4.10

COPY dump/ /home/dump

COPY mongo.sh /home/mongo.sh

RUN chmod 777 /home/mongo.sh

CMD /home/mongo.sh

FROM node:6.11.1

# create app directory in container
RUN mkdir -p /app

# set /app directory as default working directory
WORKDIR /app

# only copy package.json initially so that `RUN yarn` layer is recreated only
# if there are changes in package.json
ADD package.json package-lock.json /app/


# --no-save: Don’t generate a package-lock.json lockfile
RUN npm install --no-save --silent

# copy all file from current dir to /app in container
COPY . /app/

# overwrite .env file with example
COPY ./devops/.env.ci /app/.env

# expose port 4040
EXPOSE 4040

# cmd to start service
CMD [ "npm", "start" ]

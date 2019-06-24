[![logo](https://i.imgur.com/3OtP3p8.png)](https://softwareengineeringdaily.com/)

[![Build Status](https://travis-ci.org/SoftwareEngineeringDaily/software-engineering-daily-api.svg?branch=travis-fix)](https://travis-ci.org/SoftwareEngineeringDaily/software-engineering-daily-api)

# SEDaily-API

The backend services and API for the Software Engineering Daily [Android](https://github.com/SoftwareEngineeringDaily/SEDaily-Android), [iOS](https://github.com/SoftwareEngineeringDaily/se-daily-iOS), and [web front end](https://github.com/SoftwareEngineeringDaily/sedaily-front-end).

## Set up (local)
### *[More details here...](https://softwareengineeringdaily.github.io/Backend/gettingstarted/)
  - Install and run a local mongo client
  - `cp .env.local_example .env`
  - `npm install` or `yarn install`
  - `npm start` or `yarn start`
  - check package.json for other builds
  - use curl or Postman to make requests
  - view swagger api docs at HOST/api/docs

## Using Docker
  - `cp .env.docker_example .env`
  - Run `docker-compose up`
  - If dependencies are updated in package.json, run `docker-compose down` and then `docker-compose up --build`. This will remove the old container and rebuild the API image which installs the new dependencies.

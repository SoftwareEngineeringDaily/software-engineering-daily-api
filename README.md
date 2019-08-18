[![logo](https://i.imgur.com/3OtP3p8.png)](https://softwareengineeringdaily.com/)

[![Build Status](https://travis-ci.org/SoftwareEngineeringDaily/software-engineering-daily-api.svg?branch=master)](https://travis-ci.org/SoftwareEngineeringDaily/software-engineering-daily-api)

# Software Engineering Daily API

The backend services and API for the Software Engineering Daily [Android](https://github.com/SoftwareEngineeringDaily/SEDaily-Android), [iOS](https://github.com/SoftwareEngineeringDaily/se-daily-iOS), and [front end](https://github.com/SoftwareEngineeringDaily/sedaily-front-end) clients.

### Getting Started

The [Software Daily](https://www.softwaredaily.com) API uses MongoDB as the data store. You'll need MongoDB running locally. This requires an OS-specific install of [Docker](https://docs.docker.com/install/) and [Docker Compose](https://docs.docker.com/compose/install/#prerequisites). During the CI process for the the API, the MongoDB image data is seeded from the [staging environment](https://sedaily-frontend-staging.herokuapp.com).

```
# clone the project
git clone https://github.com/SoftwareEngineeringDaily/software-engineering-daily-api.git
cd software-engineering-daily-api/

# setup environment variables
cp .env.example .env

# run mondodb container
docker-compose up -d

# install dependencies
npm install

# serve with hot reload at localhost:4040
npm start

# test api
curl localhost:4040/api/posts
```

View the swagger api docs at http://localhost:4040/api/docs

### Contributing

Fork the repository and create a branch off of `master`. When your feature is ready, submit a pull request for the `master` branch. Be sure to include a short description of the feature or pull request and reference any related issues. The project is hosted on Heroku so if you would like a review app created just request it in the PR.

After the Travis-CI tests are successful and your pull request is approved, an admin will merge the PR. Any commits merged to `master` are deployed to the front end [staging environment](https://sedaily-frontend-staging.herokuapp.com). Once everything looks good an admin will promote staging to production and your feature will be live!

We have an active Slack community that you can reach out to for more information or just to chat with anyone. Check out the [<img src="https://upload.wikimedia.org/wikipedia/commons/7/76/Slack_Icon.png" alt="Slack Channel" width="20px"/> SED app development](https://softwaredaily.slack.com/app_redirect?channel=sed_app_development) slack channel. Also see the [Open Source Guide](https://softwareengineeringdaily.github.io/).

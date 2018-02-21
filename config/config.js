import Joi from 'joi';

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

// define validation for all the env vars
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .allow(['development', 'production', 'test', 'provision'])
    .default('development'),
  BASE_URL: Joi.string()
    // .allow(['https://www.softwaredaily.com', 'http://localhost:4040'])
    .default('https://www.softwaredaily.com'),
  EVENTS_API_BASE_URL: Joi.string().required(),
  SEND_GRID_KEY: Joi.string().required(),
  PORT: Joi.number()
    .default(4040),
  MONGOOSE_DEBUG: Joi.boolean()
    .when('NODE_ENV', {
      is: Joi.string().equal('development'),
      then: Joi.boolean().default(true),
      otherwise: Joi.boolean().default(false)
    }),
  JWT_SECRET: Joi.string().required()
    .description('JWT Secret required to sign'),
  AD_FREE_URL: Joi.string().required()
    .description('URL for ad free podcasts'),
  MONGO_HOST: Joi.string().required()
    .description('Mongo DB host url'),
  MONGO_HOST_TEST: Joi.string()
    .description('Mongo DB test host url'),
  MONGO_PORT: Joi.number()
    .default(27017),
  FACEBOOK_ID: Joi.string().required()
    .description('Facbook application id'),
  FACEBOOK_SECRET: Joi.string().required()
    .description('Facebook application secret')
}).unknown()
  .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  baseUrl: envVars.BASE_URL,
  sendGridKey: envVars.SEND_GRID_KEY,
  mongooseDebug: envVars.MONGOOSE_DEBUG,
  adFreeURL: envVars.AD_FREE_URL,
  jwtSecret: envVars.JWT_SECRET,
  eventStreamUrl: envVars.EVENTS_API_BASE_URL,
  mongo: {
    host: envVars.MONGO_HOST,
    test: envVars.MONGO_HOST_TEST,
    port: envVars.MONGO_PORT
  },
  facebook: {
    clientID: envVars.FACEBOOK_ID,
    clientSecret: envVars.FACEBOOK_SECRET
  }
};

export default config;

import Joi from 'joi';

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

// define validation for all the env vars
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .allow(['development', 'production', 'test', 'provision'])
    .default('development'),
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
  MONGO_HOST: Joi.string().required()
    .description('Mongo DB host url'),
  MONGO_HOST_TEST: Joi.string()
    .description('Mongo DB test host url'),
  MONGO_PORT: Joi.number()
    .default(27017),
  FACEBOOK_ID: Joi.string().required()
    .description('Facbook application id'),
  FACEBOOK_SECRET: Joi.string().required()
    .description('Facebook application secret'),
  GOOGLE_ID: Joi.string().required()
    .description('Google application id'),
  GOOGLE_SECRET: Joi.string().required()
    .description('Google application secret')
}).unknown()
  .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongooseDebug: envVars.MONGOOSE_DEBUG,
  jwtSecret: envVars.JWT_SECRET,
  mongo: {
    host: envVars.MONGO_HOST,
    test: envVars.MONGO_HOST_TEST,
    port: envVars.MONGO_PORT
  },
  facebook: {
    clientID: envVars.FACEBOOK_ID,
    clientSecret: envVars.FACEBOOK_SECRET
  },
  google: {
    clientID: envVars.GOOGLE_ID,
    clientSecret: envVars.GOOGLE_SECRET
  }
};

export default config;

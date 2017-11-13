const swaggerJSDoc = require('swagger-jsdoc');
const express = require('express');

const router = express.Router(); // eslint-disable-line new-cap

// Swagger definition aka OpenAPI v2.0
// https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md

const swaggerDefinition = {
  info: {
    // API information (required)
    title: 'Software Engineering Daily', // Title (required)
    version: '2.0.0', // Version (required)
    description: 'Software Engineering Daily API Documentation. You can use these by not only browsing the API routes, but also by executing requests against the server. Authorized routes require a valid JSON Web Token.'
  },
  basePath: '/api',
  produces: ['application/json'],
  consumes: ['application/json'],
};

const options = {
  swaggerDefinition,
  apis: [
    // controllers include parameters, tags and paths
    './server/controllers/*.js',
    // modeles include definitions
    './server/models/*.js',
    // a few "general" paths are defined in index
    './server/routes/index.route.js',
    // responses, securityDefinitions and general definitions/parameters in separate yaml
    './server/docs/*.yaml',
  ]
};
const swaggerSpec = swaggerJSDoc(options);

router.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

router.use('/', express.static(__dirname));

module.exports = router;

import express from 'express';
import expressJwt from 'express-jwt';
import companyController from '../controllers/company.controller';
import loadFullUser from '../middleware/loadFullUser.middleware';
import ensureIsAdmin from '../middleware/ensureIsAdmin.middleware';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router
  .route('/')
  .get(
    expressJwt({ secret: config.jwtSecret })
    , loadFullUser
    , ensureIsAdmin
    , companyController.list
  )
  .post(
    expressJwt({ secret: config.jwtSecret })
    , loadFullUser
    , ensureIsAdmin // TODO: refactor to "loadAdmin"
    , companyController.create
  );
router.route('/upload-image')
  .post(
      expressJwt({ secret: config.jwtSecret })
    , loadFullUser
    , ensureIsAdmin
    , companyController.signS3CompanyLogoUpload
  )
router.route('/findByLocalUrl/:localUrl')
  .get(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: false })
    , companyController.findByLocalUrl
  );
router.route('/:companyId')
/** GET /api/company/:companyId - Get company */
  .get(
    expressJwt({ secret: config.jwtSecret })
    , companyController.get
  )
  .put(
    expressJwt({ secret: config.jwtSecret, credentialsRequired: true })
    , loadFullUser
    , ensureIsAdmin
    , companyController.update
  )
  .delete(
    expressJwt({ secret: config.jwtSecret })
    , loadFullUser
    , ensureIsAdmin
    , companyController.delete
  );

export default router;

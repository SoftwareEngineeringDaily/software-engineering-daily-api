import express from 'express';
import expressJwt from 'express-jwt';
import multer from 'multer';
import companyController from '../controllers/company.controller';
import loadFullUser from '../middleware/loadFullUser.middleware';
import ensureIsAdmin from '../middleware/ensureIsAdmin.middleware';
import config from '../../config/config';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
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
.delete(
  expressJwt({ secret: config.jwtSecret})
  , loadFullUser
  , ensureIsAdmin
  , companyController.delete
);

export default router;

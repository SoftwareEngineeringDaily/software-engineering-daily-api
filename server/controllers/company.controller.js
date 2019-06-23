import httpStatus from 'http-status';
import Company from '../models/company.model';
import APIError from '../helpers/APIError';
import { signS3 } from '../helpers/s3';
import config from '../../config/config';

export default {
  list: async (req, res, next) => {
    try {
      const query = Company.where('isDeleted').equals(false);
      const companies = await query.sort('-dateCreated').exec();
      return res.json(companies);
    } catch (err) {
      return next(err);
    }
  },

  findByLocalUrl: async (req, res, next) => {
    try {
      const company = await Company.findOne({ localUrl: req.params.localUrl });
      if (!company) {
        return next(new APIError('Company not found', httpStatus.NOT_FOUND));
      }
      return res.json(company.toObject());
    } catch (err) {
      return next(err);
    }
  },

  get: async (req, res, next) => {
    try {
      const company = await Company.findById(req.params.companyId);
      if (!company) {
        return next(new APIError('Company not found', httpStatus.NOT_FOUND));
      }
      return res.json(company.toObject());
    } catch (err) {
      return next(err);
    }
  },

  signS3CompanyLogoUpload: (req, res, next) => {
    const { fileType } = req.body;
    const randomNumberString = `${Math.random()}`;
    const newFileName = `company_images/${randomNumberString.replace('.', '_')}`;

    const cbSuccess = (result) => {
      res.write(JSON.stringify(result));
      res.end();
    };

    // eslint-disable-next-line
    const cbError = err => {
      if (err) {
        console.log(err); // eslint-disable-line
        const error = new APIError(
          'There was a problem getting a signed url',
          httpStatus.SERVICE_UNAVAILABLE,
          true
        );
        return next(error);
      }
    };
    signS3(config.aws.profilePicBucketName, fileType, newFileName, cbSuccess, cbError);
  },
  update: async (req, res, next) => {
    try {
      const company = await Company.findById(req.params.companyId);

      if (!company) {
        return next(new APIError('Company not found', httpStatus.NOT_FOUND));
      }

      // Just a failsafe:
      if (!req.fullUser.isAdmin) {
        return next(new APIError('Not allowed to update company', httpStatus.UNAUTHORIZED));
      }

      if (company.isDeleted) {
        return next(new APIError(
          'Not allowed to update this company as it has been deleted',
          httpStatus.FORBIDDEN
        ));
      }

      const updated = Object.assign(company, req.body);
      await updated.save();

      return res.status(httpStatus.OK).json(updated);
    } catch (err) {
      return next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const newCompany = new Company(req.body);
      newCompany.author = req.user;
      await newCompany.save();

      return res.status(httpStatus.CREATED).json({ status: 'success' });
    } catch (err) {
      return next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const company = await Company.findById(req.params.companyId);

      if (!company) {
        return next(new APIError('Company not found', httpStatus.NOT_FOUND));
      }

      // Just a failsafe:
      if (!req.fullUser.isAdmin) {
        return next(new APIError('Not allowed to delete a company', httpStatus.UNAUTHORIZED));
      }

      /* Since we are checking for being an admin, it should be fine..
      if (company.author.toString() !== req.user._id.toString()) {
        return next(new APIError('Not allowed to delete a company you did not create',
        httpStatus.UNAUTHORIZED));
      }
      */

      const updatedCompany = Object.assign(company, { isDeleted: true });
      await updatedCompany.save();

      return res.status(httpStatus.OK).json({});
    } catch (err) {
      return next(err);
    }
  }
};

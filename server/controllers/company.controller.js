import httpStatus from 'http-status';
import Company from '../models/company.model';
import APIError from '../helpers/APIError';

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
      const company = await Company
        .findById(req.params.companyId);

      if (!company) {
        return next(new APIError('Company not found', httpStatus.NOT_FOUND));
      }

      // Just a failsafe:
      if (!req.fullUser.isAdmin) {
        return next(new APIError('Not allowed to delete a company', httpStatus.UNAUTHORIZED));
      }

      /* Since we are checking for being an admin, it should be fine..
      if (company.author.toString() !== req.user._id.toString()) {
        return next(new APIError('Not allowed to delete a company you did not create', httpStatus.UNAUTHORIZED));
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

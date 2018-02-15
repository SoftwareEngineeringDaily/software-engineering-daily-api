import httpStatus from 'http-status';
import Company from '../models/Company.model';
import APIError from '../helpers/APIError';

export default {

  get: async (req, res, next) => {
  },

  create: async (req, res, next) => {
    try {
      const newCompany = new Company(req.body);
      newCompany.author = req.user;
      await newCompany.save();
      return res.status(httpStatus.CREATED).json(newCompany.toObject(), true);
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
      if(!req.fullUser.isAdmin) {
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
  },

}

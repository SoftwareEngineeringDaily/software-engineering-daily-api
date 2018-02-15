import httpStatus from 'http-status';
import Company from '../models/Company.model';
import APIError from '../helpers/APIError';

export default {

  list: async (req, res, next) => {
  },

  create: async (req, res, next) => {
    try {
      const newCompany = new Company(req.body);
      await newCompany.save();
      return res.status(httpStatus.CREATED).json(newCompany.toObject(), true);
    } catch (err) {
      return next(err);
    }
  }

}

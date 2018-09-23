import httpStatus from 'http-status';
import ReCAPTCHA from 'recaptcha2';
import config from '../../config/config';
import APIError from '../helpers/APIError';

const reCaptcha = new ReCAPTCHA({
  siteKey: config.recaptcha.siteKey,
  secretKey: config.recaptcha.secretKey
});

function validateRecaptcha(req, res, next) {
  const { recaptchaResponse } = req.body;
  return reCaptcha.validate(recaptchaResponse)
    .then(() => next())
    .catch((errorCodes) => {
      const error = new APIError(`Recaptcha error: ${reCaptcha.translateErrors(errorCodes)}`, httpStatus.UNAUTHORIZED, true);
      return next(error);
    });
}

export default validateRecaptcha;

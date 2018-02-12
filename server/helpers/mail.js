import config from '../../config/config';

const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(config.sendGridKey);

export default sgMail;

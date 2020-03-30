import config from '../../config/config';
import MailTemplate from '../controllers/mailTemplate.controller';

const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(config.sendGridKey);

const options = {
  templatesFiles: ['sd-simple-template'],
  bodiesFiles: ['sd-simple-body', 'sd-body-topic-maintainer', 'sd-body-topic-publish', 'sd-body-topic-interest'],
  mailTemplates: [{
    name: 'simple',
    body: 'sd-simple-body'
  }, {
    name: 'topicMaintainer',
    body: 'sd-body-topic-maintainer'
  }, {
    name: 'topicPublish',
    body: 'sd-body-topic-publish'
  }, {
    name: 'topicInterest',
    body: 'sd-body-topic-interest'
  }]
};

const mailTemplate = new MailTemplate(options, sgMail);

export default {
  sgMail,
  mailTemplate
};

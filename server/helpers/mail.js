import config from '../../config/config';
import MailTemplate from '../controllers/mailTemplate.controller';

const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(config.sendGridKey);

const options = {
  templatesFiles: ['sd-simple-template'],
  bodiesFiles: ['sd-simple-body', 'sd-body-topic-maintainer', 'sd-body-topic-publish'],
  mailTemplates: [{
    name: 'simple',
    body: 'sd-simple-body'
  }, {
    name: 'topicMaintainer',
    body: 'sd-body-topic-maintainer'
  }, {
    name: 'topicPublish',
    body: 'sd-body-topic-publish'
  }]
};

const mailTemplate = new MailTemplate(options, sgMail);

export default {
  sgMail,
  mailTemplate
};

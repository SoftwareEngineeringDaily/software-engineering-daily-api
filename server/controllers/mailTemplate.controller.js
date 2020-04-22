import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { series } from 'async';
import config from '../../config/config';

const templateFolder = path.resolve('server/templates/email');

function getFiles(files, folder, callback) {
  const result = [];
  const items = [];
  for (const idx in files) { // eslint-disable-line
    items.push((cb) => {
      fs.readFile(`${templateFolder}/${files[idx]}.handlebars`, (err, res) => {
        if (err) return cb(err);
        result.push({
          name: files[idx],
          data: res.toString()
        });
        return cb();
      });
    });
  }
  series(items, (err) => {
    if (err) return console.error(`[MailTemplate] ${err}`);
    return callback(result);
  });
}

class MailTemplate {
  constructor(options, sgMail) {
    this.sgMail = sgMail;
    this.options = options;
    this.prepareBlankTemplates();
    this.registerPartials();
  }

  prepareBlankTemplates() {
    this.options.mailTemplates.forEach((template) => {
      this[template.name] = () => {};
    });
  }

  registerPartials() {
    getFiles(this.options.templatesFiles, templateFolder, (files) => {
      files.forEach((template) => {
        handlebars.registerPartial(template.name, template.data);
      });
      this.compileTemplates();
    });
  }

  compileTemplates() {
    this.compiledTemplates = {};
    getFiles(this.options.bodiesFiles, templateFolder, (files) => {
      files.forEach((template) => {
        this.compiledTemplates[template.name] = handlebars.compile(template.data);
      });
      this.prepateTemplates();
    });
  }

  prepateTemplates() {
    this.options.mailTemplates.forEach((mailTemplate) => {
      this[mailTemplate.name] = (options) => {
        if (!this.compiledTemplates[mailTemplate.body]) {
          const msg = `[MailTemplate] handlebars template ${mailTemplate.template} not found`;
          console.error(msg);
          return false;
        }
        return this.sendMail(options, this.compiledTemplates[mailTemplate.body]);
      };
    });
  }

  sendMail(options, template) {
    const content = (options.data) ? template.apply(this, [options.data]) : '';

    const mailMsg = {
      from: options.from || config.email.fromAddress,
      html: content,
      text: options.text || content.replace(/(<([^>]+)>)/ig, ''),
      ...options
    };

    return (async () => {
      try {
        this.sgMail.send(mailMsg);
        return true;
      } catch (e) {
        console.error(`[SendGrid] ${e}`);
        return false;
      }
    })();
  }
}
export default MailTemplate;

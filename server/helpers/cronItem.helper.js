import { CronJob } from 'cron';

class CronItem {
  constructor(config) {
    this.name = config.name || '';
    this.time = config.time || null;
    this.timeZone = config.timeZone;
    this.runOnInit = config.runOnInit || false;
    this.callback = config.callback;
  }

  createJob() {
    this.job = new CronJob(this.time, this.callback, null, false, this.timeZone || null, this);
  }
}

export default CronItem;

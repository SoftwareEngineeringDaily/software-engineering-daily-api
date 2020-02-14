import rssPublic from '../crons/RSSPublic.cron';

const cronItems = [rssPublic];

class CronJobs {
  constructor() {
    this.jobs = [];
    this.createJobs();
  }

  createJobs() {
    cronItems.forEach((item) => {
      item.createJob();
      this.jobs.push(item);
    });
  }

  start() {
    console.log('Starting CronJobs');
    this.jobs.forEach((item) => {
      item.job.start();
      if (item.runOnInit) item.callback();
    });
  }

  pause() {
    console.log('Pausing CronJobs');
    this.jobs.forEach((item) => {
      item.job.stop();
    });
  }
}
module.exports = CronJobs;

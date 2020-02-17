import rssPublic from '../crons/rssPublic.cron';

const cronItems = [rssPublic];

class CronJobs {
  constructor() {
    this.jobs = [];
    this.initialStart = true;
    this.createJobs();
  }

  createJobs() {
    cronItems.forEach((item) => {
      item.createJob();
      this.jobs.push(item);
    });
  }

  start() {
    this.jobs.forEach((item) => {
      item.job.start();
      if (item.runOnInit && this.initialStart) item.callback();
    });
    this.initialStart = false; // run just on app start
  }

  pause() {
    console.log('Pausing CronJobs');
    this.jobs.forEach((item) => {
      item.job.stop();
    });
  }
}
export default CronJobs;

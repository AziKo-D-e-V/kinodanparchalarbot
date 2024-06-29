const cron = require("node-cron");
const CronExpression = require("./job.helper");
const axios = require("axios");
const config = require("./../config");

let job; // Reference to the cron job
let successCount = 0; // Counter for successful responses
let failCount = 0; // Counter for failed responses

const startJob = () => {
  if (job) {
    console.log("Job is already running.");
    return;
  }

  job = cron.schedule(CronExpression.EVERY_3_SECONDS, async function () {
    try {
      const response = await axios.get(
        `https://api.telegram.org/bot${config.TOKEN}/getMe`
      );
      if (response.status === 200) {
        console.log("Bot is up and running.");
        successCount++;
      } else {
        console.log(`Unexpected response status: ${response.status}`);
        failCount++;
      }
    } catch (error) {
      console.error("Error fetching bot info:", error);
    }
  });

  console.log("Job started.");
};

const stopJob = () => {
  if (!job) {
    console.log("Job is not running.");
    return;
  }

  job.stop();
  job = null;
  console.log("Job stopped.");
};

const getJobResult = () => {
  return `Success Count: ${successCount}\nFail Count: ${failCount}`;
};

module.exports = { startJob, stopJob, getJobResult };

require("dotenv").config();

const config = {
  TOKEN: process.env.TOKEN,
  DB_URL: process.env.DB_URL,
  CHANNEL_ID: process.env.CHANNEL_ID,
  MESSAGE_THREAD_ID: process.env.MESSAGE_THREAD_ID,
  USERS_THREAD_ID: process.env.USERS_THREAD_ID,
  MESSAGE_GROUP_ID: process.env.MESSAGE_GROUP_ID,
  ERROR_THREAD_ID: "667",
  MESSAGES_THREAD_ID: "410", // admin messages group thread id
  CHANNEL_LINK: process.env.CHANNEL_LINK,
  MESSAGES_GROUP_ID: "-1001926273739", //admin messages
  DEV_CHANNEL: "-1001975830564",
  TEST_CHANNEL_LINK: "-1001986169547", // test channel "Moon Star"
};

module.exports = config;

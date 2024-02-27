require("dotenv").config();

const config = {
  TOKEN: process.env.TOKEN,
  DB_URL: process.env.DB_URL,
  CHANNEL_ID: process.env.CHANNEL_ID,
  MESSAGE_THREAD_ID: process.env.MESSAGE_THREAD_ID,
  USERS_THREAD_ID: process.env.USERS_THREAD_ID,
  MESSAGE_GROUP_ID: process.env.MESSAGE_GROUP_ID,
  CHANNEL_LINK: process.env.CHANNEL_LINK,
  TEST_CHANNEL_LINK: "-1001986169547", // test channel "Moon Star"
};

module.exports = config;

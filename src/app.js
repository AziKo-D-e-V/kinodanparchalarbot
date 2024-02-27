const config = require("./config");
const { connect } = require("mongoose");
const { Bot, session } = require("grammy");
require("dotenv/config");
const BotController = require("./modules/admin.bot");
const Auth = require("./modules/auth.bot");
const commandBot = require("./helper/commands");
const token = config.TOKEN;
const bot = new Bot(token);

bot.use(
  session({
    initial: () => ({
      step: "start",
    }),
  })
);

bot.use(commandBot);
bot.use(Auth);
bot.use(BotController);

const bootstrap = async (bot) => {
  try {
    const connetParams = {};
    connect(config.DB_URL, connetParams);
    console.log("Kinodan.Parchalar * * * * - Database connection");
  } catch (error) {
    console.log(error.message);
  }
};
bootstrap();

bot.start(console.log("Kinodan.Parchalar bot started"));

const config = require("./config");
const { connect } = require("mongoose");
const { Bot, session, GrammyError, HttpError } = require("grammy");
require("dotenv/config");
const BotController = require("./modules/admin.bot");
const Auth = require("./modules/auth.bot");
const commandBot = require("./helper/commands");
const token = config.TOKEN;
const bot = new Bot(token);

bot.api.setMyCommands([
  {
    command: "start",
    description: "Botni qayta ishga tushirish",
  },
  {
    command: "dev",
    description: "Admin va dasturchi",
  },
  {
    command: "id",
    description: "ID ni bilish",
  },
]);

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

bot.catch((err) => {
  console.log(err);
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

bot.start(console.log("Kinodan.Parchalar bot started"));

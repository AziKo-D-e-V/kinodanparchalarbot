const { Router } = require("@grammyjs/router");
const router = new Router((ctx) => ctx.session.step);
const bot = require("../helper/commands");
const usersModel = require("../models/users.model");
const { inlineKeyboard, keyboard } = require("../helper/keyboards");
const config = require("../config");
const ordersModel = require("../models/orders.model");

bot.command("start", async (ctx) => {
  try {
    const user = ctx.message.from;
    const first_name = ctx.message.from.first_name;
    const last_name = ctx.message.from.last_name;

    const findBotUser = await usersModel.findOne({
      user_id: user.id,
    });

    if (!findBotUser) {
      await usersModel.create({
        first_name: user?.first_name,
        last_name: user?.last_name,
        username: user?.username,
        user_id: user.id,
      });

      await ctx.reply(
        `Assalom aleykum  <b>${
          first_name || last_name
        }</b>👋 \n\n<b> KinodanParchalar</b> kanaliga obuna bo'ling`,
        {
          reply_markup: inlineKeyboard,
          parse_mode: "HTML",
        }
      );
      let text = `#new_user\n\nFirst name: ${user?.first_name}\nLast name: ${user?.last_name}\nUsername: @${user?.username}\nUser ID: ${user.id}`;
      await ctx.api.sendMessage(config.MESSAGE_GROUP_ID, text, {
        message_thread_id: config.USERS_THREAD_ID,
      });
      await ctx.reply(
        "Kino, serial yoki multifilm buyurtmasi bo'lsa yozib qoldiring."
      );

      ctx.session.step = "command";
    } else if (findBotUser.is_admin == true) {
      ctx.reply(
        `Assalom aleykum  <b>${
          first_name || last_name
        }</b>👋 \n\n<b> KinodanParchalar</b> kanali admini ekaningizdan mamnunman😉`,
        {
          reply_markup: keyboard,
          parse_mode: "HTML",
        }
      );
      ctx.session.step = "admin";
    } else {
      await ctx.reply(
        `Assalom aleykum  <b>${
          first_name || last_name
        }</b>👋 \n\n<b> KinodanParchalar</b> kanaliga obuna bo'ling`,
        {
          reply_markup: inlineKeyboard,
          parse_mode: "HTML",
        }
      );
      await ctx.reply(
        "Kino, serial yoki multifilm buyurtmasi bo'lsa yozib qoldiring.",
        {
          reply_markup: { remove_keyboard: true },
        }
      );

      ctx.session.step = "command";
    }
  } catch (error) {
    console.log(error);
    await ctx.api.sendMessage(
      config.MESSAGE_GROUP_ID,
      `/start funksiyada xatolik <code>${error.message}</code>`,
      {
        message_thread_id: 1,
        parse_mode: "HTML",
      }
    );
  }
});

const command = router.route("command");
command.on("message", async (ctx) => {
  const message = ctx.message.text;
  const message_id = ctx.message.message_id;
  const fromId = ctx.message.from.id;
  const forward_date = ctx.message.forward_date;

  if (ctx.message.chat.type == "private") {
    const sendVideo = await ctx.api.forwardMessage(
      config.MESSAGE_GROUP_ID,
      fromId,
      message_id,
      {
        message_thread_id: config.MESSAGE_THREAD_ID,
      }
    );

    const a = await ordersModel.create({
      order_text: message || ctx.message?.caption,
      user_id: ctx.message.from.id,
      forward_date: sendVideo.forward_origin.date,
      file_id: ctx.message.video?.file_id,
      file_unique_id: ctx.message?.video.file_unique_id,
    });

    await ctx.reply(
      "Siz yuborgan kino buyurtmasi adminlarga jo'natildi. Adminlar javobini kuting."
    );
  } else if (ctx.message.chat.type === "supergroup") {
    try {
      const data = ctx.message.reply_to_message.forward_date;

      const result = await ordersModel.findOne({ forward_date: data });

      const response = `👮Admin:\n\n${ctx.message.text}`;

      await ctx.api.sendMessage(result.user_id, response, {
        reply_message_id: ctx.message.reply_to_message.message_id,
      });

      await ctx.reply("Xabar jo'natildi ✅✅✅", {
        message_thread_id: config.MESSAGE_THREAD_ID,
      });
    } catch (error) {
      await ctx.reply(
        `Xabar jo'natishda xatolik paydo bo'ldi. \n\n<code>${error.message}</code>`,
        {
          parse_mode: "HTML",
        }
      );
      console.log(error);
    }
  }
});

module.exports = router;

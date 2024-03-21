const { Router } = require("@grammyjs/router");
const router = new Router((ctx) => ctx.session.step);
const bot = require("../helper/commands");
const usersModel = require("../models/users.model");
const { inlineKeyboard, keyboard, configKey } = require("../helper/keyboards");
const config = require("../config");
const ordersModel = require("../models/orders.model");
const adminMessageModel = require("../models/admin.message.model");

bot.command("dev", (ctx) => {
  try {
    const copymsg = 21;
    const chatId = ctx.chat.id;
    const from_chat_id = config.DEV_CHANNEL;
    ctx.api.copyMessage(chatId, from_chat_id, copymsg);
  } catch (error) {
    ctx.session.step = "text";
    ctx.api.sendMessage(5634162263, "Error command 'dev'\n\n" + error.message);
    console.log(error);
  }
});

bot.command("id", (ctx) => {
  ctx.reply(`Your account id   <code>${ctx.message.from.id}</code>`, {
    parse_mode: "HTML",
  });

  ctx.session.step = "command";
});

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
      let text = `#new_user\n\nFirst name: ${
        user?.first_name || ""
      }\nLast name: ${user?.last_name || ""}\nUsername: ${
        user.username ? `@${user.username}` : ""
      }\nUser ID: ${user.id}`;
      await ctx.api.sendMessage(config.MESSAGE_GROUP_ID, text, {
        message_thread_id: config.USERS_THREAD_ID,
      });
      await ctx.reply(
        "Kino, serial yoki multifilm buyurtmasi bo'lsa yozib qoldiring."
      );

      ctx.session.step = "command";
    } else if (findBotUser.is_admin == true) {
      ctx.session.admin = true;

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
      forward_date: sendVideo.forward_origin.date || forward_date,
      file_id: ctx.message.video?.file_id,
      file_unique_id: ctx.message.video?.file_unique_id,
    });

    await ctx.reply(
      "Siz yuborgan kino buyurtmasi adminlarga jo'natildi. Adminlar javobini kuting."
    );
  } else if (ctx.message.chat.type === "supergroup") {
    try {
      const admin = await usersModel.findOne({
        user_id: ctx.message.from.id,
        is_admin: true,
      });

      if (!admin) {
        ctx.reply("Sizga adminlik huquqi berilmagan🙅‍♂️😔");
        ctx.session.step = "command";
      } else {
        const data = ctx.message.reply_to_message.forward_date;

        const result = await ordersModel.findOne({ forward_date: data });

        const response = `👮🏻‍♂️Admin:\n\n${ctx.message.text}`;

        try {
          await ctx.api.sendMessage(result.user_id, response, {
            reply_message_id: ctx.message.reply_to_message.message_id,
          });
        } catch (error) {
          if (
            error.error_code === 403 ||
            error.description === "Forbidden: bot was blocked by the user"
          ) {
            await ctx.reply(
              `User botni bloklagani bois xabar jo'natilmadi. \n\n<code>${error.message}</code>`,
              {
                parse_mode: "HTML",
                message_thread_id: config.MESSAGE_THREAD_ID,
              }
            );
          } else {
            await ctx.reply(
              `Xabar jonatishdagi xatolik. \n\n<code>${error.message}</code>`,
              {
                parse_mode: "HTML",
                message_thread_id: config.MESSAGE_THREAD_ID,
              }
            );
          }
        }
        await ctx.reply("Xabar jo'natildi ✅✅✅", {
          message_thread_id: config.MESSAGE_THREAD_ID,
        });
      }
    } catch (error) {
      await ctx.reply(
        `Xabar jo'natishda xatolik paydo bo'ldi. \n\n<code>${error.message}</code>`,
        {
          parse_mode: "HTML",
        }
      );
    }
  }
});

bot.on("message", async (ctx, next) => {
  if (ctx.message.chat.type === "supergroup") {
    const admin = await usersModel.findOne({
      user_id: ctx.message.from.id,
      is_admin: true,
    });

    if (admin && ctx.chat.id == config.MESSAGE_GROUP_ID) {
      const data = ctx.message.reply_to_message?.forward_date;

      const result = await ordersModel.findOne({ forward_date: data });

      const response = `👮🏻‍♂️Admin:\n\n${ctx.message.text}`;
      try {
        await ctx.api.sendMessage(result.user_id, response, {
          reply_message_id: ctx.message.reply_to_message.message_id,
        });

        await ctx.reply("Xabar jo'natildi ✅✅✅", {
          message_thread_id: config.MESSAGE_THREAD_ID,
        });
      } catch (error) {
        if (
          error.error_code === 403 ||
          error.description === "Forbidden: bot was blocked by the user"
        ) {
          await ctx.reply(
            `User botni bloklagani bois xabar jo'natilmadi. \n\n<code>${error.message}</code>`,
            {
              parse_mode: "HTML",
              message_thread_id: config.MESSAGE_THREAD_ID,
            }
          );
        } else {
          await ctx.reply(
            `Xabar jonatishdagi xatolik. \n\n<code>${error.message}</code>`,
            {
              parse_mode: "HTML",
              message_thread_id: config.MESSAGE_THREAD_ID,
            }
          );
        }
      }
    } else if (
      admin.user_id == "5204343498" &&
      config.MESSAGES_GROUP_ID == ctx.chat.id
    ) {
      const data = ctx.message.reply_to_message?.forward_date;

      const result = await adminMessageModel.findOne({ forward_date: data });

      const response = `👮🏻‍♂️Admin:\n\n${ctx.message.text}`;
      try {
        await ctx.api.sendMessage(result.user_id, response, {
          reply_message_id: ctx.message.reply_to_message.message_id,
        });

        await ctx.reply("Xabar jo'natildi ✅✅✅", {
          message_thread_id: config.MESSAGES_THREAD_ID,
        });
      } catch (error) {
        if (
          error.error_code === 403 ||
          error.description === "Forbidden: bot was blocked by the user"
        ) {
          await ctx.reply(
            `Admin botni bloklagani bois xabar jo'natilmadi. \n\n<code>${error.message}</code>`,
            {
              parse_mode: "HTML",
              message_thread_id: 410,
            }
          );
        } else {
          await ctx.reply(
            `Xabar jonatishdagi xatolik. \n\n<code>${error.message}</code>`,
            {
              parse_mode: "HTML",
              message_thread_id: 410,
            }
          );
        }
      }
    }
  } else if (ctx.message.chat.type === "private") {
    const message = ctx.message.text;
    const message_id = ctx.message.message_id;
    const fromId = ctx.message.from.id;
    const forward_date = ctx.message.forward_date;
    const first_name = ctx.message.from.first_name;
    const last_name = ctx.message.from.last_name;
    const user = ctx.message.from;

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

      let text = `#new_user\n\nFirst name: ${
        user?.first_name || ""
      }\nLast name: ${user?.last_name || ""}\nUsername: @${
        user?.username || ""
      }\nUser ID: ${user.id}`;
      await ctx.api.sendMessage(config.MESSAGE_GROUP_ID, text, {
        message_thread_id: config.USERS_THREAD_ID,
      });

      const sendVideo = await ctx.api.forwardMessage(
        config.MESSAGE_GROUP_ID,
        fromId,
        message_id,
        {
          message_thread_id: config.MESSAGE_THREAD_ID,
        }
      );

      await ctx.reply(
        "Siz yuborgan kino buyurtmasi adminlarga jo'natildi. Adminlar javobini kuting."
      );

      const a = await ordersModel.create({
        order_text: message || ctx.message?.caption,
        user_id: ctx.message.from.id,
        forward_date: sendVideo.forward_origin.date || forward_date,
        file_id: ctx.message.video?.file_id,
        file_unique_id: ctx.message.video?.file_unique_id,
      });

      ctx.session.step = "command";
    } else if (findBotUser.is_admin == true) {
      if (ctx.session.step == "sendPost") {
        ctx.session.step = "sendPost";
      } else if (ctx.session.step == "savePostCaption") {
        ctx.session.step = "savePostCaption";
      } else if (ctx.session.step == "sendVideo") {
        ctx.session.step = "sendVideo";
      } else if (ctx.session.step == "updateSetting") {
        ctx.session.step = "updateSetting";
      } else if (ctx.session.step == "updateDefaultText") {
        ctx.session.step = "updateDefaultText";
      } else if (ctx.session.step == "listenSettingText") {
        ctx.session.step = "listenSettingText";
      } else if (ctx.session.step == "listenId") {
        ctx.session.step = "listenId";
      } else if (ctx.session.step == "mainMenu") {
        ctx.session.step = "mainMenu";
      } else if (ctx.session.step == "sendMessageToSuperAdmin") {
        ctx.session.step = "sendMessageToSuperAdmin";
      } else if (ctx.session.step == "removeAdminIdListen") {
        ctx.session.step = "removeAdminIdListen";
      } else if (ctx.session.step == "sendMsgToAdmins") {
        ctx.session.step = "sendMsgToAdmins";
      } else {
        ctx.session.step = "admin";
      }
      next();
    } else {
      const message = ctx.message.text;
      const message_id = ctx.message.message_id;
      const fromId = ctx.message.from.id;
      const forward_date = ctx.message.forward_date;
      try {
        const sendVideoOrMSG = await ctx.api.forwardMessage(
          config.MESSAGE_GROUP_ID,
          fromId,
          message_id,
          {
            message_thread_id: config.MESSAGE_THREAD_ID,
          }
        );
        const photoFileId = ctx.message.photo
          ? ctx.message.photo[0].file_id
          : "";
        const photoFileUniqueId = ctx.message.photo
          ? ctx.message.photo[0].file_unique_id
          : "";

        const a = await ordersModel.create({
          order_text: message || ctx.message?.caption,
          user_id: ctx.message.from.id,
          forward_date: sendVideoOrMSG.forward_origin.date || forward_date,
          file_id: ctx.message.video?.file_id || photoFileId,
          file_unique_id:
            ctx.message.video?.file_unique_id || photoFileUniqueId,
        });
        await ctx.reply(
          "Siz yuborgan kino buyurtmasi adminlarga jo'natildi. Adminlar javobini kuting."
        );

        ctx.session.step = "command";
      } catch (error) {
        await ctx.api.sendMessage(
          config.MESSAGE_GROUP_ID,
          `/start funksiyada xatolik <code>${error.message}</code>`,
          {
            message_thread_id: 1,
            parse_mode: "HTML",
          }
        );
      }
    }
  }
});

module.exports = router;

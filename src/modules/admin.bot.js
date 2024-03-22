const { Router } = require("@grammyjs/router");
const router = new Router((ctx) => ctx.session.step);
const bot = require("../helper/commands");
const {
  configKey,
  keyboard,
  SettingKeyboard,
  mainMenu,
  sendPostKeyboard,
} = require("../helper/keyboards");
const usersModel = require("../models/users.model");
const postSetting = require("../models/post.settings.model");
const config = require("../config");
const postsModel = require("../models/posts.model");
const adminMessageModel = require("../models/admin.message.model");

const admin = router.route("admin");
admin.hears(configKey.users_counter, async (ctx) => {
  const withoutAdmin = await usersModel.countDocuments({ is_admin: false });
  const admins = await usersModel.countDocuments({ is_admin: true });

  ctx.reply(`Users: ${withoutAdmin}\n\nAdmins: ${admins}`, {
    reply_markup: keyboard,
  });

  ctx.session.step = "admin";
});

// - - - - - - - - - Send Post Message - - - - - - - - - - -

admin.hears(configKey.send_post, async (ctx) => {
  const user = ctx.message.from;

  const findBotUser = await usersModel.findOne({
    user_id: user.id,
  });

  if (findBotUser.is_admin != true) {
  }
  ctx.reply(
    "<b>Kinodan.Parchalar</b> kanaliga kino, serial yoki multifilmni jo'nating",
    {
      reply_markup: mainMenu,
      parse_mode: "HTML",
    }
  );

  ctx.session.step = "sendPost";
});

const sendPost = router.route("sendPost");
sendPost.on("message:video", async (ctx) => {
  ctx.session.video = {
    file_id: ctx.message.video.file_id,
    file_unique_id: ctx.message.video.file_unique_id,
  };

  ctx.reply("Kino, serial yoki multifilm nomini kiriting", {
    reply_markup: {
      remove_keyboard: true,
    },
  });

  ctx.session.step = "savePostCaption";
});

sendPost.hears(configKey.main_menu, (ctx) => {
  ctx.reply("Quyidagi bo'limlarni birini tanlang", {
    reply_markup: keyboard,
  });

  ctx.session.step = "admin";
});

const savePostCaption = router.route("savePostCaption");
savePostCaption.on("message", async (ctx) => {
  const defaultCaption = await postSetting.find();

  const caption = `${ctx.message.text}\n\n\n${defaultCaption[0].caption}`;

  ctx.replyWithVideo(ctx.session.video.file_id, {
    caption: caption,
    caption_entities: ctx.message?.entities,
  });

  ctx.reply("Post to'g'riligiga ishonchingiz komilmi?", {
    reply_markup: sendPostKeyboard,
  });

  ctx.session.video.caption = caption;
  ctx.session.video.entities = ctx.message.entities;

  ctx.session.step = "sendVideo";
});

const sendVideo = router.route("sendVideo");
sendVideo.hears(configKey.back, (ctx) => {
  ctx.session.step = "savePostCaption";
  ctx.reply("Kino, serial yoki multifilm nomini kiriting", {
    reply_markup: {
      remove_keyboard: true,
    },
  });
});

sendVideo.hears(configKey.yes, async (ctx) => {
  const video = ctx.session.video;

  const data = await ctx.api.sendVideo(config.CHANNEL_ID, video.file_id, {
    caption: video.caption,
    caption_entities: video.entities,
  });

  await ctx.reply("Muvoffaqiyatli yakunlandi✅", {
    reply_markup: keyboard,
  });

  await postsModel.create({
    admin_id: ctx.message.from.id,
    message_id: data.message_id,
  });

  ctx.session.step = "admin";
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// - - - - - - - - - - - Send Message SuperAdmin - - - - - - - - - - -
admin.hears(configKey.send_message_for_superadmin, async (ctx) => {
  const superAdmin = "5204343498";
  const admin = ctx.message.from.id;

  if (superAdmin != admin) {
    ctx.reply("SuperAdminga xabar yuboringizni yuboring", {
      reply_markup: mainMenu,
    });

    ctx.session.step = "sendMessageToSuperAdmin";
  } else {
    ctx.reply("Adminlarga jo'natish kerak bo'lgan xabarni jo'nating", {
      reply_markup: mainMenu,
    });

    ctx.session.step = "sendMsgToAdmins";
  }
});

const sendMsgToAdmins = router.route("sendMsgToAdmins");
sendMsgToAdmins.hears(configKey.main_menu, (ctx) => {
  ctx.reply("Quyidagi bo'limlarni birini tanlang", {
    reply_markup: keyboard,
  });

  ctx.session.step = "mainMenu";
});

sendMsgToAdmins.on("msg", async (ctx) => {
  const msg = ctx.message.text;

  const adminsGetAll = await usersModel.find({ is_admin: true });
  const admins = [];
  adminsGetAll.forEach((admin) => {
    admins.push(admin.user_id);
  });

  for (let i = 0; i < admins.length; i++) {
    setTimeout(() => {
      ctx.api.sendMessage(admins[i], msg);
    }, (admin + 1) * 250);
  }

  await ctx.reply("Adminlarga xabar jo'natildi✅", {
    reply_markup: keyboard,
  });

  ctx.session.step = "admin";
});

const sendMessageToSuperAdmin = router.route("sendMessageToSuperAdmin");
sendMessageToSuperAdmin.on("message", async (ctx) => {
  const superAdmin = "5204343498";
  const admin = ctx.message.from.id;

  const fromId = ctx.message.from.id;
  const message_id = ctx.message.message_id;

  if (superAdmin != admin) {
    ctx.reply(
      "Siz yuborgan xabar SuperAdminga jo'natildi.✅ Iltimos SuperAdmin javobini kuting",
      {
        reply_markup: keyboard,
      }
    );

    const sendMessage = await ctx.api.forwardMessage(
      config.MESSAGES_GROUP_ID,
      fromId,
      message_id,
      {
        message_thread_id: config.MESSAGES_THREAD_ID,
      }
    );
    const photoFileId = ctx.message.photo ? ctx.message.photo[0].file_id : "";
    const photoFileUniqueId = ctx.message.photo
      ? ctx.message.photo[0].file_unique_id
      : "";

    await adminMessageModel.create({
      message_text: ctx.message.text,
      user_id: admin,
      forward_date: sendMessage.forward_origin.date || forward_date,
      file_id: ctx.message.video?.file_id || photoFileId,
      file_unique_id: ctx.message.video?.file_unique_id || photoFileUniqueId,
    });

    ctx.session.step = "admin";
  }
});

sendMessageToSuperAdmin.hears(configKey.main_menu, (ctx) => {
  ctx.reply("Quyidagi bo'limlarni birini tanlang", {
    reply_markup: keyboard,
  });

  ctx.session.step = "mainMenu";
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// - - - - - - - - - - - Post settings - - - - - - - - - - -
admin.hears(configKey.post_settings, async (ctx) => {
  const mainAdmin = "5204343498";
  const admin = ctx.message.from.id;

  if (mainAdmin != admin) {
    ctx.reply("Sizga post matnini sozlashga ruxsatingiz yo'q😕", {
      reply_markup: keyboard,
    });

    ctx.session.step = "admin";
  } else {
    const settings = await postSetting.find();

    if (settings) {
      await ctx.reply(`${settings[0]?.caption}`, {
        reply_markup: SettingKeyboard,
      });

      ctx.session.defaultTextId = settings[0]?.id;

      ctx.session.step = "updateSetting";
    } else {
      await ctx.reply(`Post matnini sozlash uchun default xabarni jo'nating`, {
        reply_markup: {
          remove_keyboard: true,
        },
      });

      ctx.session.step = "listenSettingText";
    }
  }
});

const updateSetting = router.route("updateSetting");
updateSetting.hears(configKey.main_menu, (ctx) => {
  ctx.reply("Quyidagi bo'limlarni birini tanlang", {
    reply_markup: keyboard,
  });

  ctx.session.step = "mainMenu";
});

updateSetting.hears(configKey.setting_update, (ctx) => {
  ctx.reply("Yangilash uchun matnni jo'nating", {
    reply_markup: mainMenu,
  });

  ctx.session.step = "updateDefaultText";
});

const updateDefaultText = router.route("updateDefaultText");
updateDefaultText.on("message", async (ctx) => {
  const text = ctx.message.text;
  const id = ctx.session.defaultTextId;

  if (id == undefined) {
    const defaultText = await postSetting.create({ caption: text });
    await ctx.reply(`Post uchun xabar yaratildi\n\n${defaultText?.caption}`, {
      reply_markup: keyboard,
    });
    ctx.session.step = "mainMenu";
  } else {
    const defaultText = await postSetting.findByIdAndUpdate(
      id,
      {
        caption: text,
      },
      { new: true }
    );

    await ctx.reply(`Post uchun xabar yangilandi\n\n${defaultText?.caption}`, {
      reply_markup: keyboard,
    });

    ctx.session.step = "mainMenu";
  }
});

const listenSettingText = router.route("listenSettingText");
listenSettingText.hears(configKey.main_menu, (ctx) => {
  ctx.reply("Quyidagi bo'limlarni birini tanlang", {
    reply_markup: keyboard,
  });

  ctx.session.step = "mainMenu";
});

listenSettingText.on("message", async (ctx) => {
  const text = ctx.message.text;

  const saveDb = await postSetting.create({ caption: text });

  await ctx.reply("Muvofaqqiyatli saqlandi✅");
  await ctx.reply(`${saveDb.caption}`, {
    reply_markup: keyboard,
  });

  ctx.session.step = "mainMenu";
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// - - - - - - - Add new admin - - - - - - - - - - - - - -
admin.hears(configKey.add_admin, async (ctx) => {
  const superAdmin = "5204343498";
  const admin = ctx.message.from.id;

  if (superAdmin != admin) {
    ctx.reply("Sizga botga admin qo'shish uchun ruxsat yo'q😕", {
      reply_markup: keyboard,
    });

    ctx.session.step = "admin";
  } else {
    ctx.reply("Qo'shish kerak bo'lgan adminning ID sini jo'nating");
    ctx.session.step = "listenId";
  }
});

// --------------------------------------------------------

const listenId = router.route("listenId");
listenId.on("message", async (ctx) => {
  const id = ctx.message.text;

  const findUserById = await usersModel.findOne({
    user_id: id,
    is_admin: false,
  });

  if (!findUserById) {
    ctx.reply("Siz yuborgan ID dagi foydalanuvchi topilmadi😕", {
      reply_markup: keyboard,
    });

    ctx.session.step = "admin";
  } else {
    findUserById.is_admin = true;
    await findUserById.save();
    try {
      ctx.api.sendMessage(id, "Sizga adminlik berildi🤩🤩🤩", {
        reply_markup: keyboard,
      });
    } catch (error) {
      console.log(error);
      await ctx.api.sendMessage(
        config.MESSAGE_GROUP_ID,
        `Yangi admin qo'shishda xatolik \n\n<code>${error.message}</code>`,
        {
          message_thread_id: config.ERROR_THREAD_ID,
          parse_mode: "HTML",
        }
      );
    }
    ctx.reply("Yangi admin tayinlandi✅", {
      reply_markup: keyboard,
    });

    ctx.session.step = "admin";
  }
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// - - - - - - - Remove admin - - - - - - - - - - - - - -
admin.hears(configKey.remove_admin, async (ctx) => {
  const superAdmin = "5204343498";
  const admin = ctx.message.from.id;

  if (superAdmin != admin) {
    ctx.reply("Sizga botga admin qo'shish uchun ruxsat yo'q😕", {
      reply_markup: keyboard,
    });

    ctx.session.step = "admin";
  } else {
    const admins = await usersModel.find({ is_admin: true });

    let text = admins
      .map(
        (admin, index) =>
          `${index + 1}. ${admin.first_name ? admin.first_name : ""}  ${
            admin.last_name ? admin.last_name : ""
          } \n${admin.username ? "@" + admin.username : ""} - 🆔 <code>${
            admin.user_id
          }</code>`
      )
      .join(`\n`);

    await ctx.reply(text, {
      parse_mode: "HTML",
    });
    await ctx.reply(
      "Adminlikni olib tashlash uchun adminning ID sini jo'nating",
      {
        reply_markup: mainMenu,
      }
    );

    ctx.session.step = "removeAdminIdListen";
  }
});

const removeAdminIdListen = router.route("removeAdminIdListen");

removeAdminIdListen.hears(configKey.main_menu, (ctx) => {
  ctx.reply("Quyidagi bo'limlarni birini tanlang", {
    reply_markup: keyboard,
  });

  ctx.session.step = "admin";
});

removeAdminIdListen.on("message", async (ctx) => {
  const id = ctx.message.text;

  const findUserById = await usersModel.findOne({
    user_id: id,
    is_admin: true,
  });

  if (!findUserById) {
    ctx.reply("Siz yuborgan ID dagi foydalanuvchi topilmadi😕", {
      reply_markup: keyboard,
    });

    ctx.session.step = "admin";
  } else if (findUserById == "5204343498") {
    ctx.reply("Siz adminlikni o'zingizdan olib tashlay olmaysiz😕", {
      reply_markup: mainMenu,
    });

    ctx.session.step = "admin";
  } else {
    findUserById.is_admin = false;
    await findUserById.save();
    try {
      ctx.api.sendMessage(id, "Sizdan adminlik olib tashlandi😕", {
        reply_markup: {
          remove_keyboard: true,
        },
      });
    } catch (error) {
      console.log(error);
      await ctx.api.sendMessage(
        config.MESSAGE_GROUP_ID,
        `Yangi admin qo'shishda xatolik \n\n<code>${error.message}</code>`,
        {
          message_thread_id: 1,
          parse_mode: "HTML",
        }
      );
    }
    ctx.reply("Adminlik muvoffaqiyatli olib tashlandi tayinlandi✅", {
      reply_markup: keyboard,
    });

    ctx.session.step = "admin";
  }
});

// --------------------------------------------------------

const mainM = router.route("mainMenu");
mainM.hears(configKey.main_menu, (ctx) => {
  ctx.reply("Quyidagi bo'limlarni birini tanlang", {
    reply_markup: keyboard,
  });

  ctx.session.step = "admin";
});

module.exports = router;

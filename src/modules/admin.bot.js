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
      reply_markup: { remove_keyboard: true },
      parse_mode: "HTML",
    }
  );

  ctx.session.step = "sendPost";
  // console.log(ctx.session.step);
});

const sendPost = router.route("sendPost");
sendPost.on("message:video", async (ctx) => {
  // console.log(ctx.message.video);

  ctx.session.video = {
    file_id: ctx.message.video.file_id,
    file_unique_id: ctx.message.video.file_unique_id,
  };

  ctx.reply("Kino, serial yoki multifilm nomini kiriting");

  ctx.session.step = "savePostCaption";
});

const savePostCaption = router.route("savePostCaption");
savePostCaption.on("message", async (ctx) => {
  const defaultCaption = await postSetting.find();

  const caption = `${ctx.message.text}\n\n\n${defaultCaption[0].caption}`;

  ctx.replyWithVideo(ctx.session.video.file_id, {
    caption: caption,
  });

  ctx.reply("Post to'g'riligiga ishonchingiz komilmi?", {
    reply_markup: sendPostKeyboard,
  });

  ctx.session.video.caption = caption;

  ctx.session.step = "sendVideo";
});

const sendVideo = router.route("sendVideo");
sendVideo.hears(configKey.back, (ctx) => {
  ctx.session.step = "savePostCaption";
  ctx.reply("Kino, serial yoki multifilm nomini kiriting");
});

sendVideo.hears(configKey.yes, async (ctx) => {
  const video = ctx.session.video;

  const data = await ctx.api.sendVideo(config.CHANNEL_ID, video.file_id, {
    caption: video.caption,
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

// - - - - - - - - - - - Post settings - - - - - - - - - - -
admin.hears(configKey.post_settings, async (ctx) => {
  const mainAdmin = "5204343498";
  const admin = ctx.message.from.id;

  if (mainAdmin != admin) {
    ctx.reply("Sizga post matnini sozlashga ruxsatingiz yo'q😕", {
      reply_markup: keyboard,
    });

    ctx.session.step = "mainMenu";
  } else {
    const settings = await postSetting.find();

    if (settings) {
      await ctx.reply(`${settings[0]?.caption}`, {
        reply_markup: SettingKeyboard,
      });

      ctx.session.defaultTextId = settings[0].id;

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
  const mainAdmin = "5204343498";
  const admin = ctx.message.from.id;

  if (mainAdmin != admin) {
    ctx.reply("Sizga botga admin qo'shish uchun ruxsat yo'q😕", {
      reply_markup: keyboard,
    });

    ctx.session.step = "admin";
  } else {
    ctx.reply("Qo'shish kerak bo'lgan adminning ID sini jo'nating");
    ctx.session.step = "listenId";
  }
  ctx.session.step = "admin";
});

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

    ctx.reply("Yangi admin tayinlandi✅", {
      reply_markup: keyboard,
    });

    ctx.session.step = "admin";
  }
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const mainM = router.route("mainMenu");
mainM.hears(configKey.main_menu, (ctx) => {
  ctx.reply("Quyidagi bo'limlarni birini tanlang", {
    reply_markup: keyboard,
  });

  ctx.session.step = "admin";
});

updateSetting.hears(configKey.main_menu, (ctx) => {
  ctx.reply("Quyidagi bo'limlarni birini tanlang", {
    reply_markup: keyboard,
  });

  ctx.session.step = "admin";
});

module.exports = router;

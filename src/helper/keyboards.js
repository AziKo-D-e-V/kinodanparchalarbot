const { Keyboard, InlineKeyboard } = require("grammy");
const config = require("../config");

const configKey = {
  send_post: "🪄 Post chiqarish 📤",
  post_settings: "📌 Post matnini sozlash 📝",
  add_admin: "👮🏻‍♂️ Admin qo'shish 👮🏻‍♂️",
  users_counter: "Bot foydalanuvchilari 🧮",
  setting_update: "♻️ Yangilash ♻️",
  main_menu: "🏠 Asosiy bo'limga o'tish",
  yes: "Ha, tayyor ✅",
  back: "🔙 Ortga 🔙",
};

const keys = [
  [configKey.send_post],
  [configKey.post_settings, configKey.add_admin],
  [configKey.users_counter],
];

const buttonRows = keys.map((row) => row.map((key) => Keyboard.text(key)));
const keyboard = Keyboard.from(buttonRows).resized();

// - - - - - - - - - setting Keyboard - - - - - - - - - - - -

const SettingKeyboard = new Keyboard()
  .text(configKey.main_menu)
  .text(configKey.setting_update)
  .resized();

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// - - - - Inline Keyboard - - - - - - - - - -
const inlineKeyboard = new InlineKeyboard().url(
  "➕ Kanalga qo'shilish ➕",
  config.CHANNEL_LINK
);

const mainMenu = new Keyboard().text(configKey.main_menu).resized();

const sendPostKeyboard = new Keyboard()
  .text(configKey.back)
  .text(configKey.yes)
  .resized();

module.exports = {
  configKey,
  sendPostKeyboard,
  keyboard,
  inlineKeyboard,
  SettingKeyboard,
  mainMenu,
};

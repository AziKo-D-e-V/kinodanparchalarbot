const { Keyboard, InlineKeyboard } = require("grammy");
const config = require("../config");

const configKey = {
  send_post: "🪄 Post chiqarish 📤",
  post_settings: "📌 Post matnini sozlash 📝",
  add_admin: "👮🏻‍♂️ Admin qo'shish 👮🏻‍♂️",
  remove_admin: "👮🏻‍♂️ Admindan chiqarish ❌",
  send_message_for_superadmin: "👮‍♂️ SuperAdminga xabar jo'natish ✅",
  users_counter: "Bot foydalanuvchilari 🧮",
  setting_update: "♻️ Yangilash ♻️",
  main_menu: "🏠 Asosiy bo'limga o'tish",
  yes: "Ha, tayyor ✅",
  back: "🔙 Ortga 🔙",
};

const keys = [
  [configKey.send_post],
  [configKey.users_counter],
  [configKey.send_message_for_superadmin],
  [configKey.post_settings],
  [configKey.add_admin, configKey.remove_admin],
];

const buttonRows = keys.map((row) => row.map((key) => Keyboard.text(key)));
const keyboard = Keyboard.from(buttonRows).resized();

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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

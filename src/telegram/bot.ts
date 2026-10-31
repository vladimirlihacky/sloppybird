import { Bot } from "grammy";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const GAME_URL = process.env.TELEGRAM_GAME_URL ?? "";

const bot = new Bot(BOT_TOKEN);

bot.command("game", async (ctx) => {
  await ctx.replyWithGame("sloppybird");
});

bot.use(async (ctx, next) => {
  console.log(`📥 Получен апдейт от пользователя ${ctx.from?.id}:`, ctx.update);
  await next();
});


bot.on("callback_query:game_short_name", async (ctx) => {
  try {
    await ctx.answerCallbackQuery({
      url: GAME_URL,
    });
  } catch (error) {
    console.error("Ошибка при открытии игры:", error);
  }
});

bot.start();
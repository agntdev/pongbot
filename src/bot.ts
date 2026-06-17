import { createBot, menuKeyboard, resolveSessionStorage } from "@agntdev/bot-toolkit";
import type { StorageAdapter } from "grammy";

// The per-chat session shape (ephemeral conversation state only). Extend as the
// bot grows. Durable domain data must NOT live here — use the toolkit's
// persistent storage (see AGENTS.md).
export interface Session {
  // example: step?: "awaiting_amount";
}

interface PingCount {
  count: number;
}

const mainMenu = menuKeyboard(
  [
    { text: "🏓 Ping", data: "cmd:ping" },
    { text: "📊 Count", data: "cmd:count" },
  ],
  1,
);

const PING_COUNT_KEY = "global:ping_count";

/**
 * buildBot — assembles the bot and registers every handler, but does NOT start
 * it. Shared by the runtime entry (src/index.ts) and the Tests-gate harness
 * (src/harness-entry.ts) so both exercise the exact same bot. Add new commands
 * and flows here.
 */
export function buildBot(token: string) {
  const sessionStore = resolveSessionStorage<Session>(undefined);
  const pingStore: StorageAdapter<PingCount> = sessionStore as unknown as StorageAdapter<PingCount>;

  const bot = createBot<Session>(token, {
    initial: () => ({}),
    storage: sessionStore,
  });

  bot.command("ping", async (ctx) => {
    const current = await pingStore.read(PING_COUNT_KEY);
    const next = (current?.count ?? 0) + 1;
    await pingStore.write(PING_COUNT_KEY, { count: next });
    await ctx.reply("pong 🏓");
  });

  bot.command("count", async (ctx) => {
    const current = await pingStore.read(PING_COUNT_KEY);
    const count = current?.count ?? 0;
    await ctx.reply(`Total pings served: ${count}`);
  });

  bot.command("start", async (ctx) => {
    await ctx.reply(
      "Hi — I'm PongBot! Send /ping to get a pong 🏓 and increment the global counter.",
      { reply_markup: mainMenu },
    );
  });

  bot.callbackQuery("cmd:ping", async (ctx) => {
    await ctx.answerCallbackQuery();
    const current = await pingStore.read(PING_COUNT_KEY);
    const next = (current?.count ?? 0) + 1;
    await pingStore.write(PING_COUNT_KEY, { count: next });
    await ctx.reply("pong 🏓");
  });

  bot.callbackQuery("cmd:count", async (ctx) => {
    await ctx.answerCallbackQuery();
    const current = await pingStore.read(PING_COUNT_KEY);
    const count = current?.count ?? 0;
    await ctx.reply(`Total pings served: ${count}`);
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      "Available commands:\n" +
        "/start - Welcome message and main menu\n" +
        "/ping - Get a pong 🏓 and increment the global counter\n" +
        "/help - Show this help message",
    );
  });

  bot.on(":entities:bot_command", async (ctx) => {
    await ctx.reply("Use /ping or /count.");
  });

  bot.on("message:text", async (ctx) => {
    await ctx.reply("I didn't understand that. Try /start to see what I can do.");
  });

  bot.catch((err) => {
    console.error(`Error while handling update ${err.ctx.update.update_id}:`, err.error);
    err.ctx.reply("Sorry, something went wrong. Please try again later.").catch(() => {});
  });

  return bot;
}

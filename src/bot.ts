import { createBot } from "@agntdev/bot-toolkit";

// The per-chat session shape (ephemeral conversation state only). Extend as the
// bot grows. Durable domain data must NOT live here — use the toolkit's
// persistent storage (see AGENTS.md).
export interface Session {
  // example: step?: "awaiting_amount";
}

const HELP_TEXT = [
  "Available commands:",
  "/start — Start the bot",
  "/help — Show this help message",
].join("\n");

const UNKNOWN_COMMAND_TEXT = "Unknown command. Try /help to see what I can do.";

const GENERIC_TEXT = "I didn't understand that. Try /start to see what I can do.";

const ERROR_TEXT = "Something went wrong. Please try again later.";

/**
 * buildBot — assembles the bot and registers every handler, but does NOT start
 * it. Shared by the runtime entry (src/index.ts) and the Tests-gate harness
 * (src/harness-entry.ts) so both exercise the exact same bot. Add new commands
 * and flows here.
 */
export function buildBot(token: string) {
  const bot = createBot<Session>(token, {
    initial: () => ({}),
  });

  bot.command("start", async (ctx) => {
    await ctx.reply("Welcome! I am ready to help.");
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(HELP_TEXT);
  });

  bot.on("message:text", async (ctx) => {
    const entities = ctx.message.entities;
    const isCommand = entities?.some(
      (e) => e.type === "bot_command" && e.offset === 0
    );
    if (isCommand) {
      await ctx.reply(UNKNOWN_COMMAND_TEXT);
    } else {
      await ctx.reply(GENERIC_TEXT);
    }
  });

  bot.catch(async (err) => {
    console.error("[agntdev-bot] unhandled error:", err.error);
    try {
      await err.ctx.reply(ERROR_TEXT);
    } catch {
      // If replying fails, the error is already logged above.
    }
  });

  return bot;
}

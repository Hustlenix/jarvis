/** Canonical slash-command names and descriptions for the existing Jarvis app. */
export const COMMANDS = Object.freeze([
  Object.freeze({
    name: 'help',
    slash: '/lalith-jarvis-help',
    description: "Show Lalith's Jarvis commands and features",
  }),
  Object.freeze({
    name: 'ping',
    slash: '/lalith-jarvis-ping',
    description: "Check Lalith's Jarvis latency and uptime",
  }),
  Object.freeze({
    name: 'catfact',
    slash: '/lalith-jarvis-catfact',
    description: "Get a random cat fact from Lalith's Jarvis",
  }),
  Object.freeze({ name: 'joke', slash: '/lalith-jarvis-joke', description: "Get a random joke from Lalith's Jarvis" }),
]);

export const COMMAND_NAMES = Object.freeze(Object.fromEntries(COMMANDS.map(({ name, slash }) => [name, slash])));

export const COMMAND_HELP_LINES = Object.freeze(COMMANDS.map(({ slash, description }) => `${slash} - ${description}`));

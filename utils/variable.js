// Caches
bu.guildCache = {};
bu.userCache = {};
bu.tagCache = {};
bu.globalVars = {};

// A list of command usage for the current session
bu.commandStats = {};
bu.commandUses = 0;
// How many times cleverbot has been used
bu.cleverbotStats = 0;
// How many messages the bot has made
bu.messageStats = 0;
// A map of messages to await for
bu.awaitMessages = {};

bu.catOverrides = true;
/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:22:51
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:22:51
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

// Caches
bu.guildCache = {};
bu.userCache = {};
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
// A map of reactions to wait for
bu.awaitReactions = {};
// A map containing the rwlocks for tags
bu.tagLocks = {};
bu.stats = {};
bu.cleverStats = {};


bu.catOverrides = true;

bu.debug = false;
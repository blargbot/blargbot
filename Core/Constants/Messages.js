/**
 * All messages that the bot emits are to be *externalized* so that we can implement locales.
 * These messages are all *functions* taking varying amounts of parameters. This is for
 * dynamic messages and consistency.
 */

const Generic = {
    MessageTooLong: () => 'Whoops! I tried to send a message that was too long. If you think this is a bug, please report it!'
};

const Command = {
    ping: {
        usage: () => 'ping',
        info: () => 'Pong!\nFinds the command latency.'
    }
};

module.exports = {
    Generic
};
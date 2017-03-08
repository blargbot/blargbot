const { Locale } = _discord.Core.Structures;

class en_US extends Locale {
    constructor() {
        super();
    }

    get generic() {
        return {
            messagetoolong: () => 'Whoops! I tried to send a message that was too long. If you think this is a bug, please report it!'
        };
    }

    get command() {
        return {
            ping: {
                info: () => 'Pong!\nFinds the command latency.',
                usage: () => 'ping',
                first: [
                    () => 'Some filler message here'
                ],
                output: (time) => `Pong! (${time}ms)`
            } 
        }
    }
}

module.exports = en_US;
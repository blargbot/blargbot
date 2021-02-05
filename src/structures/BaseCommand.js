const moment = require('moment-timezone');
const newbutils = require('../newbu');

class BaseCommand {
    /**
     * @param {import('../cluster').Cluster} cluster
     * @param {object} params
     */
    constructor(cluster, {
        name,
        category = newbutils.commandTypes.GENERAL,
        hidden = false,
        usage = '',
        info = '',
        aliases = [],
        onlyOn = undefined,
        flags = undefined,
        cannotDisable = false,
        userRatelimit = false,
        channelRatelimit = false,
        cooldown = false
    }) {
        this.cluster = cluster;
        this.name = name;
        this.category = category;
        this.hidden = hidden;
        this.usage = usage;
        this.info = info;
        this.aliases = aliases;
        this.onlyOn = onlyOn;
        this.flags = flags;
        this.cannotDisable = cannotDisable;
        this.userRatelimit = userRatelimit;
        this.channelRatelimit = channelRatelimit;
        this.cooldown = cooldown;

        this.users = {};
        this.channels = {};
        this.cooldowns = {};
    }

    get isCommand() {
        return true;
    }

    get longinfo() {
        return this.info;
    }

    checkBucketRatelimit(bucket, id) {
        if (!bucket[id]) {
            bucket[id] = 0;
        }

        return bucket[id];
    }

    async _execute(msg, words, text) {
        if (this.userRatelimit) {
            const times = this.checkBucketRatelimit(this.users, msg.author.id);
            if (times === 1) {
                return await this.cluster.send(msg, 'Sorry, you\'re already running this command! Please wait and try again.');
            } else if (times > 1) {
                return;
            }
        }
        if (this.channelRatelimit) {
            const times = this.checkBucketRatelimit(this.channels, msg.channel.id);
            if (times === 1) {
                return await this.cluster.send(msg, 'Sorry, this command is already running in this channel! Please wait and try again.');
            } else if (times > 1) {
                return;
            }
        }
        if (this.cooldown) {
            if (!this.cooldowns[msg.author.id]) {
                this.cooldowns[msg.author.id] = { lastTime: Date.now(), times: 1 };
            } else {
                const diff = Date.now() - this.cooldowns[msg.author.id].lastTime;

                if (Date.now() - this.cooldowns[msg.author.id].lastTime <= this.cooldown) {
                    let times = this.cooldowns[msg.author.id].times++;
                    if (times === 1) {
                        const diffText = Math.round((this.cooldown - diff) / 100) / 10;
                        if (diffText < 0) {
                            return await this.cluster.send(msg, `Sorry, you ran this command too recently! Please wait and try again.`);
                        }
                        return await this.cluster.send(msg, `Sorry, you ran this command too recently! Please wait ${diffText}s and try again.`);
                    } else if (times > 1) {
                        return;
                    }
                }
            }
        }

        try {
            if (this.cooldown) {
                this.cooldowns[msg.author.id] = {
                    lastTime: Date.now() + 9999999,
                    times: 1
                };
            }
            if (this.userRatelimit) {
                this.users[msg.author.id]++;
            }
            if (this.channelRatelimit) {
                this.channels[msg.channel.id]++;
            }

            const res = await this.execute(msg, words, text);
            return res;
        } catch (err) {
            throw err;
        } finally {
            if (this.cooldown) {
                this.cooldowns[msg.author.id].lastTime = Date.now();
            }
            if (this.userRatelimit) {
                delete this.users[msg.author.id];
            }
            if (this.channelRatelimit) {
                delete this.channels[msg.channel.id];
            }
        }
    }

    execute(msg, words, text) {
        throw new Error('Not implemented');
    }

    static stringify(embed) {
        let result = '';
        if (typeof embed !== 'object')
            return result;
        if (embed.title)
            result += `**${embed.title.replace(/\*/, '\\*')}**\n`;
        if (embed.description)
            result += `${embed.description}\n`;
        if (embed.fields)
            for (const field of embed.fields)
                result += `\n**${field.name.replace(/\*/, '')}**\n${field.value}`;
        if (embed.footer)
            result += `*${embed.footer.text.replace(/\*/, '')}*`;
        if (embed.footer && embed.timestamp)
            result += ' | ';
        if (embed.timestamp)
            result += `${moment(embed.timestamp).format('ddd Do MMM, YYYY [at] h:mm A')}`;
        return result;
    }
}


module.exports = BaseCommand;

/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:18:53
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-07-04 13:14:49
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const cassandra = require('cassandra-driver');
const moment = require('moment-timezone');
if (config.cassandra) {
    const cclient = new cassandra.Client({
        contactPoints: config.cassandra.contactPoints, keyspace: config.cassandra.keyspace,
        authProvider: new cassandra.auth.PlainTextAuthProvider(config.cassandra.username, config.cassandra.password)
    });
    bu.cclient = cclient;
}

bu.guildSettings = {
    set: async function (guildid, key, value, type) {
        let storedGuild = await bu.getGuild(guildid);
        let returnObj = true;
        switch (type) {
            case 'int':
                value = parseInt(value);
                if (isNaN(value)) {
                    value = undefined;
                    returnObj = 'Not a number.';
                };
                break;
            case 'bool':
                if (value == 1 || value.toLowerCase() == 'true') value = true;
                else if (value == 0 || value.toLowerCase() == 'false') value = false;
                else {
                    value = undefined;
                    returnObj = 'Expected `1`, `0`, `true`, or `false`';
                };
                break;
        }
        storedGuild.settings[key] = value;

        await r.table('guild').get(guildid).update({
            settings: r.literal(storedGuild.settings)
        }).run();
        return true;
    },
    get: async function (guildid, key) {
        let storedGuild = await bu.getGuild(guildid);

        if (!storedGuild) return {};
        return storedGuild.settings[key];
    },
    remove: async function (guildid, key) {
        let storedGuild = await bu.getGuild(guildid);

        delete storedGuild.settings[key];


        await r.table('guild').get(guildid).replace(storedGuild).run();
        console.debug(':thonkang:');
        return;
    }
};

class Version {
    constructor(major, minor, patch) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }
    incrementPatch() {
        this.patch++;
    }
    incrementMinor() {
        this.minor++;
        this.patch = 0;
    }
    incrementMajor() {
        this.major++;
        this.minor = 0;
        this.patch = 0;
    }
    async save() {
        await r.table('vars').get('version').update({
            major: this.major,
            minor: this.minor,
            patch: this.patch
        });
    }
    toString() {
        return `${this.major}.${this.minor}.${this.patch}`;
    }
}

bu.getVersion = async function () {
    let v = await r.table('vars').get('version');
    return new Version(v.major, v.minor, v.patch);
};

bu.ccommand = {
    set: async function (guildid, key, value) {
        let storedGuild = await bu.getGuild(guildid);

        storedGuild.ccommands[key.toLowerCase()] = value;

        r.table('guild').get(guildid).update({
            ccommands: storedGuild.ccommands
        }).run();
        return;
    },
    get: async function (guildid, key) {
        let storedGuild = await bu.getGuild(guildid);
        key = key.toLowerCase();
        if (!storedGuild || !storedGuild.ccommands[key]) return null;
        return storedGuild.ccommands[key];
    },
    rename: async function (guildid, key1, key2) {
        let storedGuild = await bu.getGuild(guildid);

        storedGuild.ccommands[key2.toLowerCase()] = storedGuild.ccommands[key1.toLowerCase()];
        delete storedGuild.ccommands[key1.toLowerCase()];

        r.table('guild').get(guildid).replace(storedGuild).run();
        return;
    },
    remove: async function (guildid, key) {
        let storedGuild = await bu.getGuild(guildid);

        delete storedGuild.ccommands[key.toLowerCase()];

        r.table('guild').get(guildid).replace(storedGuild).run();
        return;
    },
    sethelp: async function (guildid, key, help) {
        let storedGuild = await bu.getGuild(guildid);

        if (!storedGuild || !storedGuild.ccommands[key.toLowerCase()]) return false;
        storedGuild.ccommands[key.toLowerCase()].help = help;
        console.debug(storedGuild.ccommands[key.toLowerCase()]);
        r.table('guild').get(guildid).replace(storedGuild).run();
        return true;
    },
    gethelp: async function (guildid, key) {
        let storedGuild = await bu.getGuild(guildid);

        if (!storedGuild || !storedGuild.ccommands[key.toLowerCase()]) return undefined;
        return storedGuild.ccommands[key.toLowerCase()].help;
    }
};

bu.isNsfwChannel = async function (channelid) {
    const channel = bot.getChannel(channelid);
    return channel.nsfw;
};

bu.isBlacklistedChannel = async function (channelid) {
    let guildid = bot.channelGuildMap[channelid];
    if (!guildid) {
        //console.warn('Couldn\'t find a guild that corresponds with channel ' + channelid + ' - isBlacklistedChannel');
        return false;
    }
    let guild = await bu.getGuild(guildid);

    return guild.channels[channelid] ? guild.channels[channelid].blacklisted : false;
};


bu.getCachedTag = async function (tagname) {
    let storedTag;
    if (bu.tagCache[tagname]) {
        storedTag = bu.tagCache[tagname];
    } else {
        storedTag = await r.table('tag').get(tagname);
        bu.tagCache[tagname] = storedTag;
    }
    return storedTag;
};

bu.getCachedUser = async function (userid) {
    let storedUser;
    if (bu.userCache[userid]) {
        storedUser = bu.userCache[userid];
    } else {
        storedUser = await r.table('user').get(userid);
        bu.userCache[userid] = storedUser;
    }
    return storedUser;
};

bu.getGuild = async function (guildid) {
    let storedGuild;
    if (bu.guildCache[guildid]) {
        storedGuild = bu.guildCache[guildid];
    } else {
        storedGuild = await r.table('guild').get(guildid);
        bu.guildCache[guildid] = storedGuild;
    }
    return storedGuild;
};

const insertQuery1 = `
    INSERT INTO chatlogs (id, content, attachment, userid, msgid, channelid, guildid, msgtime, type, embeds)
        VALUES (:id, :content, :attachment, :userid, :msgid, :channelid, :guildid, :msgtime, :type, :embeds)
        USING TTL 604800
`;
const insertQuery2 = `
    INSERT INTO chatlogs_map (id, msgid, channelid) VALUES (:id, :msgid, :channelid) USING TTL 604800
`;

bu.normalize = function (r) {
    if (!r) throw new Error('No valid message was provided.');
    let n = {};
    for (const key in r) {
        if (r[key] !== null && typeof r[key] === 'object' && r[key].toJSON)
            n[key] = r[key].toJSON();
        else if (typeof r[key] !== 'function') n[key] = r[key];
    }
    n.desnowflaked = bu.unmakeSnowflake(n.id);
    n.msgtime = new Date(n.msgtime);
    try {
        n.embeds = JSON.parse(n.embeds);
    } catch (err) {
        console.log(r, n);
        console.error(err);
    }
    return n;
};

bu.getChatlog = async function (id) {
    if (!config.cassandra) return null;
    let res = await bu.cclient.execute(`SELECT channelid, id FROM chatlogs_map WHERE msgid = :id LIMIT 1`, { id }, { prepare: true });
    if (res.rows.length > 0) {
        let msg = await bu.cclient.execute(`SELECT * FROM chatlogs WHERE channelid = :channelid and id = :id LIMIT 1`, {
            id: res.rows[0].id,
            channelid: res.rows[0].channelid
        }, { prepare: true });
        if (msg.rows.length > 0)
            return bu.normalize(msg.rows[0]);
        else return null;
    } else return null;
};

bu.insertChatlog = async function (msg, type) {
    if (!config.cassandra) return null;
    if (msg.channel.id != '204404225914961920') {
        bu.Metrics.chatlogCounter.labels(type === 0 ? 'create' : type === 1 ? 'update' : 'delete').inc();
        let data = {
            id: bu.makeSnowflake(),
            content: msg.content,
            attachment: msg.attachments[0] ? msg.attachments[0].url : undefined,
            userid: msg.author.id,
            msgid: msg.id,
            channelid: msg.channel.id,
            guildid: msg.channel.guild ? msg.channel.guild.id : 'DM',
            msgtime: Date.now(),
            type: type,
            embeds: JSON.stringify(msg.embeds)
        };
        try {
            await bu.cclient.execute(insertQuery1, data, { prepare: true });
            await bu.cclient.execute(insertQuery2, { id: data.id, msgid: msg.id, channelid: msg.channel.id },
                { prepare: true });
        } catch (err) {

        }
        // r.table('chatlogs').insert({
        //     id: bu.makeSnowflake(),
        //     content: msg.content,
        //     attachment: msg.attachments[0] ? msg.attachments[0].url : undefined,
        //     userid: msg.author.id,
        //     msgid: msg.id,
        //     channelid: msg.channel.id,
        //     guildid: msg.channel.guild ? msg.channel.guild.id : 'DM',
        //     msgtime: r.epochTime(moment(msg.timestamp) / 1000),
        //     type: type,
        //     embeds: msg.embeds
        // }).run();
    }
};

/**
 * Processes a user into the database
 * @param user - The user to process
 */
bu.processUser = async function (user) {
    if (user.discriminator == '0000') return;
    let storedUser = await r.table('user').get(user.id).run();
    if (!storedUser) {
        console.debug(`inserting user ${user.id} (${user.username})`);
        r.table('user').insert({
            userid: user.id,
            username: user.username,
            usernames: [{
                name: user.username,
                date: r.epochTime(moment() / 1000)
            }],
            isbot: user.bot,
            lastspoke: r.epochTime(moment() / 1000),
            lastcommand: null,
            lastcommanddate: null,
            discriminator: user.discriminator,
            todo: []
        }).run();
    } else {
        let newUser = {};
        let update = false;
        if (storedUser.username != user.username) {
            newUser.username = user.username;
            newUser.usernames = storedUser.usernames;
            newUser.usernames.push({
                name: user.username,
                date: r.epochTime(moment() / 1000)
            });
            update = true;
        }
        if (storedUser.discriminator != user.discriminator) {
            newUser.discriminator = user.discriminator;
            update = true;
        }
        if (storedUser.avatarURL != user.avatarURL) {
            newUser.avatarURL = user.avatarURL;
            update = true;
        }
        if (update)
            r.table('user').get(user.id).update(newUser).run();
    }
};

/**
 * Changefeed stuff
 */
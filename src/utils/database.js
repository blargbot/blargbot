/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:18:53
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-21 17:38:13
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const cassandra = require('cassandra-driver');
const cclient = new cassandra.Client({
    contactPoints: config.cassandra.contactPoints, keyspace: config.cassandra.keyspace,
    authProvider: new cassandra.auth.PlainTextAuthProvider(config.cassandra.username, config.cassandra.password)
})
bu.cclient = cclient;

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

bu.getCachedGlobal = async function (varname) {
    let storedVar;
    if (bu.globalVars[varname]) {
        storedVar = bu.globalVars[varname];
    } else {
        let globalVars = await r.table('vars').get('tagVars');
        if (!globalVars) {
            await r.table('vars').insert({
                varname: 'tagVars',
                values: {}
            });
            bu.globalVars = {};
        } else bu.globalVars = globalVars.values;
        storedVar = bu.globalVars[varname];
    }
    return storedVar;
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

const insertQuery = `
    INSERT INTO chatlogs2 (id, content, attachment, userid, msgid, channelid, guildid, msgtime, type, embeds)
        VALUES (:id, :content, :attachment, :userid, :msgid, :channelid, :guildid, :msgtime, :type, :embeds)
        USING TTL 604800
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
}
bu.getChatlog = async function (id) {
    let res = await cclient.execute(`SELECT * FROM chatlogs2 WHERE msgid = ?`, [id], { prepare: true });
    let msgs = [];
    for (const row of res.rows) {
        msgs.push(bu.normalize(row));
    }
    if (msgs.length > 1)
        msgs.sort((a, b) => b.msgtime - a.msgtime);
    return msgs;
}

bu.insertChatlog = async function (msg, type) {
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
        }
        try {
            await cclient.execute(insertQuery, data, { prepare: true });
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
        //     msgtime: r.epochTime(dep.moment(msg.timestamp) / 1000),
        //     type: type,
        //     embeds: msg.embeds
        // }).run();
    }
};

/**
 * Changefeed stuff
 */
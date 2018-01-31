/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:18:53
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-01-31 12:54:33
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

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
}

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

        if (!storedGuild || !storedGuild.ccommands[key.toLowerCase()]) return null;
        return storedGuild.ccommands[key.toLowerCase()];
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

bu.insertChatlog = function (msg, type) {
    if (msg.channel.id != '204404225914961920') {
        r.table('chatlogs').insert({
            id: bu.makeSnowflake(),
            content: msg.content,
            attachment: msg.attachments[0] ? msg.attachments[0].url : undefined,
            userid: msg.author.id,
            msgid: msg.id,
            channelid: msg.channel.id,
            guildid: msg.channel.guild ? msg.channel.guild.id : 'DM',
            msgtime: r.epochTime(dep.moment(msg.timestamp) / 1000),
            type: type,
            embeds: msg.embeds
        }).run();
    }
};

/**
 * Changefeed stuff
 */

var changefeed;

async function registerChangefeed() {
    registerSubChangefeed('guild', 'guildid', bu.guildCache);
    registerSubChangefeed('user', 'userid', bu.userCache);
    registerSubChangefeed('tag', 'name', bu.tagCache);
    registerGlobalChangefeed();
}

async function registerGlobalChangefeed() {
    try {
        console.info('Registering a global changefeed!');
        changefeed = await r.table('vars').changes({
            squash: true
        }).run((err, cursor) => {
            if (err) return console.error(err);
            cursor.on('error', err => {
                console.error(err);
            });
            cursor.on('data', data => {
                if (data.new_val && data.new_val.varname == 'tagVars')
                    bu.globalVars = data.new_val.values;
            });
        });
        changefeed.on('end', registerGlobalChangefeed);
    } catch (err) {
        console.warn(`Failed to register a global changefeed, will try again in 10 seconds.`);
        setTimeout(registerGlobalChangefeed, 10000);
    }
}

async function registerSubChangefeed(type, idName, cache) {
    try {
        console.info('Registering a ' + type + ' changefeed!');
        changefeed = await r.table(type).changes({
            squash: true
        }).run((err, cursor) => {
            if (err) return console.error(err);
            cursor.on('error', err => {
                console.error(err);
            });
            cursor.on('data', data => {
                if (data.new_val) {
                    // Return if user or guild is not on thread
                    if (idName === 'guildid' && !bot.guilds.get(data.new_val[idName]))
                        return;
                    if (idName === 'userid' && !bot.users.get(data.new_val[idName]))
                        return;
                    cache[data.new_val[idName]] = data.new_val;
                } else delete cache[data.old_val[idName]];
            });
        });
        changefeed.on('end', () => registerSubChangefeed(type, idName, cache));
    } catch (err) {
        console.warn(`Failed to register a ${type} changefeed, will try again in 10 seconds.`);
        setTimeout(() => registerSubChangefeed(type, idName, cache), 10000);
    }
}

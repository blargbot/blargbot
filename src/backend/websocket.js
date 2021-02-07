/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:20:52
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-12-07 15:45:58
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const { Server } = require('ws');

const e = module.exports = {};

e.init = function (server) {
    global.wss = new Server({
        server: server
    });

    wss.broadcast = function broadcast(data) {
        wss.clients.forEach(function each(client) {
            client.send(JSON.stringify(data));
        });
    };

    wss.on('connection', function (ws) {
        console.ws('A user has connected');
        ws.on('message', function (message) {
            try {
                message = JSON.parse(message);
                // let userId = bu.getUserFromSession(message.sid);
                // if (!userId) {
                //     sendData(ws, 403, 'Not authenticated');
                //     return;
                // }
                if (!message.type) {
                    sendData(ws, 400, 'No type specified');
                    return;
                }
                switch (message.type) {
                    case 'requestShards':
                        console.ws('Shards have been requested.');
                        for (const shard of spawner.shardStats)
                            sendData(ws, 'shard', shard);
                        break;
                    // case 'displayGuild':
                    //     displayGuild(ws, message, userId);
                    //     break;
                    // case 'saveGuild':
                    //     saveGuild(ws, message, userId);
                    //     break;
                }
            } catch (err) {
                sendData(ws, 400, 'Malformed request');
            }
        });
    });
};

const codes = {
    200: 'OK',
    400: 'Bad Request',
    403: 'Forbidden',
    404: 'Not Found'
};

function sendData(ws, code, data) {
    let datum = {
        code,
        data
    };
    if (codes[code]) datum.desc = codes[code];
    ws.send(JSON.stringify(datum));
}

async function saveGuild(ws, message, userId) {
    let user = bot.users.get(userId);
    if (!user) {
        sendData(ws, 404, 'User not found');
        return;
    }
    console.debug(message);
    let guild = bot.guilds.get(message.data.guildid);
    if (!guild) {
        sendData(ws, 404, 'Guild not found');
        return;
    }
    let isStaff = await bu.isUserStaff(userId, guild.id);
    if (!isStaff) {
        sendData(ws, 403, 'Missing access');
        return;
    }
    message.data.guild = undefined;
    let res = await r.table('guild').get(message.data.guildid).replace(message.data);
    console.website(res);
    sendData(ws, 200, {
        data: 'Successfully updated settings.',
        type: 'guildSaved'
    });
}

async function displayGuild(ws, message, userId) {
    let user = bot.users.get(userId);
    if (!user) {
        sendData(ws, 404, 'User not found');
        return;
    }
    let guild = bot.guilds.get(message.data.guild);
    if (!guild) {
        sendData(ws, 404, 'Guild not found');
        return;
    }
    let isStaff = await bu.isUserStaff(userId, guild.id);
    if (!isStaff) {
        sendData(ws, 403, 'Missing access');
        return;
    }
    let storedGuild = await bu.getGuild(guild.id);
    let owner = bot.users.get(guild.ownerID);
    storedGuild.guild = {
        id: guild.id,
        name: guild.name,
        iconURL: guild.iconURL,
        owner: {
            id: owner.id,
            username: owner.username,
            discriminator: owner.discriminator,
            avatarURL: owner.avatarURL
        },
        channels: guild.channels.map(c => {
            return {
                id: c.id,
                name: c.name,
                position: c.position,
                type: c.type
            };
        }).sort((a, b) => {
            return a.position - b.position;
        }),
        roles: guild.roles.map(c => {
            return {
                id: c.id,
                name: c.name,
                position: c.position,
                color: c.color > 1 ? '#' + c.color.toString(16) : ''
            };
        }).sort((a, b) => {
            return b.position - a.position;
        })
    };
    sendData(ws, 200, {
        guild: storedGuild,
        type: 'displayGuild'
    });
}
const e = module.exports = {};
const WebSocketServer = require('ws').Server;

e.init = function(server) {
    global.wss = new WebSocketServer({
        server: server
    });

    wss.broadcast = function broadcast(data) {
        wss.clients.forEach(function each(client) {
            client.send(JSON.stringify(data));
        });
    };

    wss.on('connection', function(ws) {
        ws.on('message', function(message) {
            try {
                message = JSON.parse(message);
                logger.website('Incoming', message);
                let userId = bu.getUserFromSession(message.sid);
                if (!userId) {
                    sendData(ws, 403, 'Not authenticated');
                    return;
                }
                if (!message.type) {
                    sendData(ws, 400, 'No type specified');
                    return;
                }
                switch (message.type) {
                    case 'displayGuild':
                        displayGuild(ws, message, userId);
                        break;
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
    logger.website('Outgoing', datum);
    ws.send(JSON.stringify(datum));
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
        })
    };
    sendData(ws, 200, {
        guild: storedGuild,
        type: 'displayGuild'
    });
}
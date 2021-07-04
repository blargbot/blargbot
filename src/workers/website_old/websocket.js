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

const BaseHelper = require('./BaseHelper');
const childProcess = require('child_process');
const path = require('path');

class ImageHelper extends BaseHelper {
    constructor(client) {
        super(client);
    }

    async generate(dest, name, args = {}, message = '') {
        let channel = await this.client.Helpers.Resolve.destination(dest);
        let env = {
            BOT_TOKEN: _config.discord.token,
            IMAGE_TYPE: name,
            IMAGE_CHANNEL: channel.id,
            IMAGE_MESSAGE: message,
            IMAGE_ARGS: JSON.stringify(args)
        };

        let cp = childProcess.fork(path.join(__dirname, '..', 'Image', 'index.js'), [], {
            env
        });
    }
}

module.exports = ImageHelper;
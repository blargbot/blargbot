const { BaseEventHandler } = require("../structures/BaseEventHandler");

class ErrorEventHandler extends BaseEventHandler {
    /**
     * @param {import('../cluster').Cluster} cluster
     */
    constructor(cluster) {
        super(cluster.discord, 'error', cluster.logger);
    }

    handle(error) {
        if (error.message.indexOf('Message.guild') == -1)
            this.logger.error(error);
    }
}

module.exports = { ErrorEventHandler };
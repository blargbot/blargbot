const { BaseEventHandler } = require("../structures/BaseEventHandler");

class DebugEventHandler extends BaseEventHandler {
    /**
     * @param {import('../cluster').Cluster} cluster
     */
    constructor(cluster) {
        super(cluster.discord, 'debug', cluster.logger);
    }

    handle(message) {
        this.logger.debug(message);
    }
}

module.exports = { DebugEventHandler };
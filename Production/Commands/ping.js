const { GeneralCommand } = _core.Structures.Command;

class PingCommand extends GeneralCommand {
    constructor() {
        super({
            name: 'ping',
            usage: _constants.Messages.Command.ping.usage(),
            info: _constants.Messages.Command.ping.info()
        });
    }

    async execute() {

    }
}

module.exports = PingCommand;
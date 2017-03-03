const { GeneralCommand } = _core.Structures.Command;

class PingCommand extends GeneralCommand {
    constructor() {
        super({
            name: 'ping',
            usage: 'ping',
            info: 'Pong!\nFind the command latency.'
        });
    }

    async execute() {

    }
}

module.exports = PingCommand;
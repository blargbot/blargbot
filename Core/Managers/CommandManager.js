const Manager = require('./Manager');
const Base = require('../Structures/Command/Base');
const seqErrors = require('sequelize/lib/errors');

class CommandManager extends Manager {
    constructor(client) {
        super(client, 'Commands', Base);
        this.commandList = {};
    }

    unload(...names) {
        let name = names[names.length - 1];
        if (this.builtList[name].aliases.length > 0) {
            for (const alias of this.builtList[name].aliases) {
                delete this.builtList[alias];
            }
        }
        super.unload(name);
    }

    build(...names) {
        let name = names[names.length - 1];
        if (super.build(...names)) {
            this.commandList[name] = this.builtList[name];
            if (this.builtList[name].aliases.length > 0) {
                for (const alias of this.builtList[name].aliases) {
                    this.builtList[alias] = this.builtList[name];
                }
                this.builtList[name] == this.builtList[name];
            }
        }
    }

    async execute(name, ctx) {
        const command = this.builtList[name];
        if (command !== undefined) {
            if (await command.canExecute(ctx)) {
                try {
                    let response = await command._execute(ctx);
                    if (typeof response === 'string') {
                        await command.send(ctx, response);
                    }
                } catch (err) {
                    if (typeof err.response === 'string') {
                        try {
                            err.response = JSON.parse(err.response);
                        } catch (err) { }
                    } else
                        console.error(err);
                    if (err instanceof seqErrors.BaseError) {
                        let msg = 'Database Error:\n';
                        for (const e of err.errors) msg += `${e.message} (${e.type})\n  Path: ${e.path}\n  Value: ${e.value}\n`;
                        await ctx.decodeAndSend('error.generic', {
                            message: msg
                        });
                    } else if (typeof err.response === 'object' && typeof err.response.code === 'number') {
                        let commandText = ctx.text;
                        if (commandText.length > 100)
                            commandText = commandText.substring(0, 97) + '...';

                        switch (err.response.code) {
                            case 50001:
                            case 50004:
                            case 50009:
                            case 50013: {
                                if (await ctx.author.data.getKey('dmErrors'))
                                    await this.client.Helpers.Message.decodeAndSend(ctx.author, 'error.couldnotsend', {
                                        channel: ctx.channel.mention,
                                        error: err.response.message,
                                        command: commandText
                                    });
                                break;
                            }
                            default: {
                                await ctx.decodeAndSend('error.generic', {
                                    message: err.stack
                                });
                            }
                        }
                    } else {
                        await ctx.decodeAndSend('error.generic', {
                            message: err.stack
                        });
                    }
                }
            }
        }
    }

    has(name) {
        return this.builtList.hasOwnProperty(name);
    }
}

module.exports = CommandManager;
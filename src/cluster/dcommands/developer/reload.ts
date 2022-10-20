import { GlobalCommand } from '@blargbot/cluster/command';
import { CommandResult, ICommandManager } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';
import { ModuleLoader } from '@blargbot/core/modules';

import templates from '../../text';

const cmd = templates.commands.reload;

export class ReloadCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'reload',
            category: CommandType.DEVELOPER,
            definitions: [
                {
                    parameters: 'commands {commands[0]}',
                    description: cmd.commands.description,
                    execute: (ctx, [commands]) => this.reloadModules(ctx.cluster.commands, commands.asStrings, 'commands')
                },
                {
                    parameters: 'events {events[0]}',
                    description: cmd.events.description,
                    execute: (ctx, [events]) => this.reloadModules(ctx.cluster.events, events.asStrings, 'events')
                },
                {
                    parameters: 'services {services[0]}',
                    description: cmd.services.description,
                    execute: (ctx, [services]) => this.reloadModules(ctx.cluster.services, services.asStrings, 'services')
                }
            ]
        });
    }

    public async reloadModules<T>(loader: ModuleLoader<T> | ICommandManager, members: readonly string[], type: keyof typeof cmd): Promise<CommandResult> {
        let count = members.length;
        if (members.length === 0) {
            await (loader instanceof ModuleLoader ? loader.reload(true) : loader.load());
            count = loader.size;
        } else {
            await (loader instanceof ModuleLoader ? loader.reload(loader.source(members)) : loader.load(members));
        }

        return cmd[type].success({ count });
    }

}

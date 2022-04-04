import { GlobalCommand } from '@blargbot/cluster/command';
import { ICommandManager } from '@blargbot/cluster/types';
import { CommandType, pluralise as p } from '@blargbot/cluster/utils';
import { ModuleLoader } from '@blargbot/core/modules';

export class ReloadCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'reload',
            category: CommandType.DEVELOPER,
            definitions: [
                {
                    parameters: 'commands {commands[0]}',
                    description: 'Reloads the given commands, or all commands if none were given',
                    execute: (ctx, [commands]) => this.reloadModules(ctx.cluster.commands, commands.asStrings, 'command')
                },
                {
                    parameters: 'subtags {subtags[0]}',
                    description: 'Reloads the given subtags, or all subtags if none were given',
                    execute: (ctx, [subtags]) => this.reloadModules(ctx.cluster.subtags, subtags.asStrings, 'subtag')
                },
                {
                    parameters: 'events {events[0]}',
                    description: 'Reloads the given events, or all events if none were given',
                    execute: (ctx, [events]) => this.reloadModules(ctx.cluster.events, events.asStrings, 'event')
                },
                {
                    parameters: 'services {services[0]}',
                    description: 'Reloads the given services, or all services if none were given',
                    execute: (ctx, [services]) => this.reloadModules(ctx.cluster.services, services.asStrings, 'service')
                }
            ]
        });
    }

    public async reloadModules<T>(loader: ModuleLoader<T> | ICommandManager, members: readonly string[], type: string): Promise<string> {
        let count = members.length;
        if (members.length === 0) {
            await (loader instanceof ModuleLoader ? loader.reload(true) : loader.load());
            count = loader.size;
        } else {
            await (loader instanceof ModuleLoader ? loader.reload(loader.source(members)) : loader.load(members));
        }

        return this.success(`Successfully reloaded ${count} ${p(count, type)}`);
    }

}

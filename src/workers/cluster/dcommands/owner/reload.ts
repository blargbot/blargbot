import { BaseGlobalCommand } from '@cluster/command';
import { CommandType, pluralise as p } from '@cluster/utils';
import { ModuleLoader } from '@core/modules';

export class ReloadCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'reload',
            category: CommandType.OWNER,
            definitions: [
                {
                    parameters: 'commands {commands[0]}',
                    description: 'Reloads the given commands, or all commands if none were given',
                    execute: (ctx, [commands]) => this.reloadModules(ctx.cluster.commands, commands, 'command')
                },
                {
                    parameters: 'subtags {subtags[0]}',
                    description: 'Reloads the given subtags, or all subtags if none were given',
                    execute: (ctx, [subtags]) => this.reloadModules(ctx.cluster.subtags, subtags, 'subtag')
                },
                {
                    parameters: 'events {events[0]}',
                    description: 'Reloads the given events, or all events if none were given',
                    execute: (ctx, [events]) => this.reloadModules(ctx.cluster.events, events, 'event')
                },
                {
                    parameters: 'services {services[0]}',
                    description: 'Reloads the given services, or all services if none were given',
                    execute: (ctx, [services]) => this.reloadModules(ctx.cluster.services, services, 'service')
                }
            ]
        });
    }

    public async reloadModules<T>(loader: ModuleLoader<T>, members: string[], type: string): Promise<string> {
        let count = members.length;
        if (members.length === 0) {
            await loader.reload(true);
            count = loader.size;
        } else {
            loader.reload(loader.source(members));
        }

        return this.success(`Successfully reloaded ${count} ${p(count, type)}`);
    }

}

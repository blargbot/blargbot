import { ClusterEventService } from '../../structures/ClusterEventService';
import { CommandListResult } from '../../workers/ClusterContract';
import { Cluster } from '../Cluster';


export class CommandListHandler extends ClusterEventService<'commandList'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'commandList');
    }

    protected execute(_: unknown, reply: (data: CommandListResult) => void): void {
        const commands: CommandListResult = {};
        for (const c of this.cluster.commands.list()) {
            if (c.isCommand && !c.hidden) {
                commands[c.name] = {
                    name: c.name,
                    usage: c.usage,
                    info: c.info,
                    longinfo: c.longinfo,
                    category: c.category,
                    aliases: c.aliases,
                    flags: c.flags,
                    onlyOn: c.onlyOn
                };
            }
        }
        reply(commands);
    }
}

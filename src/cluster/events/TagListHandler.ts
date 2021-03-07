import { ClusterEventService } from '../../structures/ClusterEventService';
import { TagListResult } from '../../workers/ClusterTypes';
import { ProcessMessageHandler } from '../../workers/core/IPCEvents';
import { Cluster } from '../Cluster';


export class TagListHandler extends ClusterEventService {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'tagList');
    }

    protected execute([, , reply]: Parameters<ProcessMessageHandler>): void {
        const tags: TagListResult = {};
        for (const t of this.cluster.subtags.list()) {
            if (t.isTag) {
                tags[t.name] = {
                    category: t.category,
                    name: t.name,
                    desc: t.desc,
                    exampleCode: t.exampleCode,
                    exampleIn: t.exampleIn,
                    exampleOut: t.exampleOut,
                    deprecated: t.deprecated,
                    staff: t.staff,
                    aliases: t.aliases
                };
            }
        }
        reply(tags);
    }
}

import { ClusterEventService } from '../../structures/ClusterEventService';
import { TagListResult } from '../../workers/ClusterContract';
import { Cluster } from '../Cluster';


export class TagListHandler extends ClusterEventService<'tagList'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'tagList');
    }

    protected execute(_: unknown, reply: (data: TagListResult) => void): void {
        const tags: TagListResult = {};
        for (const t of this.cluster.subtags.list()) {
            if (t.isTag) {
                tags[t.name] = {
                    category: t.category,
                    name: t.name,
                    args: t.args,
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

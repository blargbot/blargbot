import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { SubtagListResult } from '@cluster/types';

export class ClusterGetSubtagListHandler extends ClusterEventService<'getSubtagList'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'getSubtagList', ({ reply }) => reply(this.getSubtagList()));
    }

    public getSubtagList(): SubtagListResult {
        const tags: SubtagListResult = {};
        for (const t of this.cluster.subtags.list()) {
            tags[t.name] = {
                category: t.category,
                name: t.name,
                signatures: t.signatures,
                deprecated: t.deprecated,
                staff: t.staff,
                aliases: t.aliases
            };
        }
        return tags;
    }
}

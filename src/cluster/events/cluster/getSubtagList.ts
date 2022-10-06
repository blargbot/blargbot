import { Cluster } from '@blargbot/cluster';
import { ClusterEventService } from '@blargbot/cluster/serviceTypes';
import { SubtagListResult } from '@blargbot/cluster/types';

export class ClusterGetSubtagListHandler extends ClusterEventService<`getSubtagList`> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, `getSubtagList`, ({ reply }) => reply(this.getSubtagList()));
    }

    public getSubtagList(): SubtagListResult {
        const tags: SubtagListResult = {};
        for (const t of this.cluster.bbtag.subtags.values()) {
            if (t.hidden)
                continue;
            tags[t.name] = {
                category: t.category,
                name: t.name,
                signatures: t.signatures,
                deprecated: t.deprecated,
                staff: t.staff,
                aliases: t.aliases,
                description: t.description
            };
        }
        return tags;
    }
}

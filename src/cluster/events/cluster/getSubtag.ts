import { Cluster } from '@blargbot/cluster';
import { ClusterEventService } from '@blargbot/cluster/serviceTypes';
import { SubtagDetails } from '@blargbot/cluster/types';

export class ClusterGetSubtagHandler extends ClusterEventService<'getSubtag'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'getSubtag', ({ data, reply }) => reply(this.getSubtag(data)));
    }

    protected getSubtag(name: string): SubtagDetails | undefined {
        const subtag = this.cluster.bbtag.subtags.get(name);
        if (subtag === undefined)
            return undefined;

        return {
            category: subtag.category,
            name: subtag.name,
            signatures: subtag.signatures,
            deprecated: subtag.deprecated,
            staff: subtag.staff,
            aliases: subtag.aliases,
            description: subtag.description
        };
    }
}

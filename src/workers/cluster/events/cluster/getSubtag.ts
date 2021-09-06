import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { SubtagDetails } from '@cluster/types';

export class ClusterGetSubtagHandler extends ClusterEventService<'getSubtag'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'getSubtag', ({ data, reply }) => reply(this.getSubtag(data)));
    }

    protected getSubtag(name: string): SubtagDetails | undefined {
        const subtag = this.cluster.subtags.get(name);
        if (subtag === undefined)
            return undefined;

        return {
            category: subtag.category,
            name: subtag.name,
            signatures: subtag.signatures,
            deprecated: subtag.deprecated,
            staff: subtag.staff,
            aliases: subtag.aliases
        };
    }
}

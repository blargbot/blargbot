import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { SubtagDetails } from '@cluster/types';
import { ProcessMessageHandler } from '@core/types';

export class ClusterGetSubtagHandler extends ClusterEventService {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'getSubtag');
    }

    protected execute(...[name, , reply]: Parameters<ProcessMessageHandler>): void {
        const subtag = this.cluster.subtags.get(name as string);
        if (subtag === undefined)
            return reply(undefined);

        reply<SubtagDetails>({
            category: subtag.category,
            name: subtag.name,
            signatures: subtag.signatures,
            deprecated: subtag.deprecated,
            staff: subtag.staff,
            aliases: subtag.aliases
        });
    }
}

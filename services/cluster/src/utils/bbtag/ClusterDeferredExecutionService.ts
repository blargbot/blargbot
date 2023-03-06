import type { BBTagContext, DeferredExecutionService } from '@bbtag/blargbot';

import type { Cluster } from '../../Cluster.js';

export class ClusterDeferredExecutionService implements DeferredExecutionService {
    public constructor(public readonly cluster: Cluster) {
    }

    public async defer(context: BBTagContext, content: string, delayMs: number): Promise<void> {
        await this.cluster.timeouts.insert('tag', {
            version: 4,
            source: context.guild.id,
            channel: context.channel.id,
            endtime: Date.now() + delayMs,
            context: JSON.stringify(context.serialize()),
            content: content
        });
    }
}

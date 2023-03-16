import type { BBTagScript, DeferredExecutionService } from '@bbtag/blargbot';

import type { Cluster } from '../../Cluster.js';

export class ClusterDeferredExecutionService implements DeferredExecutionService {
    public constructor(public readonly cluster: Cluster) {
    }

    public async defer(context: BBTagScript, content: string, delayMs: number): Promise<void> {
        await this.cluster.timeouts.insert('tag', {
            version: 4,
            source: context.runtime.guild.id,
            channel: context.runtime.channel.id,
            endtime: Date.now() + delayMs,
            context: JSON.stringify(context),
            content: content
        });
    }
}

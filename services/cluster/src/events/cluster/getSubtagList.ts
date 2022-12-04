import type { Cluster } from '@blargbot/cluster';
import { ClusterEventService } from '@blargbot/cluster/serviceTypes/index.js';
import type { SubtagListResult } from '@blargbot/cluster/types.js';
import { format } from '@blargbot/formatting';

export class ClusterGetSubtagListHandler extends ClusterEventService<'getSubtagList'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'getSubtagList', async ({ reply }) => reply(await this.getSubtagList()));
    }

    public async getSubtagList(): Promise<SubtagListResult> {
        const tags: SubtagListResult = {};
        const formatter = await this.cluster.util.getFormatter();
        for (const t of this.cluster.bbtag.subtags.values()) {
            if (t.hidden)
                continue;
            tags[t.name] = {
                category: t.category,
                name: t.name,
                signatures: t.signatures.map(s => ({
                    ...s,
                    description: s.description[format](formatter),
                    exampleCode: s.exampleCode[format](formatter),
                    exampleIn: s.exampleIn?.[format](formatter),
                    exampleOut: s.exampleOut[format](formatter)
                })),
                deprecated: t.deprecated,
                staff: t.staff,
                aliases: t.aliases,
                description: t.description?.[format](formatter)
            };
        }
        return tags;
    }
}

import { Cluster } from '@blargbot/cluster';
import { ClusterEventService } from '@blargbot/cluster/serviceTypes/index.js';
import { SubtagDetails } from '@blargbot/cluster/types.js';
import { format } from '@blargbot/formatting';

export class ClusterGetSubtagHandler extends ClusterEventService<'getSubtag'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'getSubtag', async ({ data, reply }) => reply(await this.getSubtag(data)));
    }

    protected async getSubtag(name: string): Promise<SubtagDetails | undefined> {
        const subtag = this.cluster.bbtag.subtags.get(name);
        if (subtag === undefined)
            return undefined;

        const formatter = await this.cluster.util.getFormatter();
        return {
            category: subtag.category,
            name: subtag.name,
            signatures: subtag.signatures.map(s => ({
                ...s,
                description: s.description[format](formatter),
                exampleCode: s.exampleCode[format](formatter),
                exampleIn: s.exampleIn?.[format](formatter),
                exampleOut: s.exampleOut[format](formatter)
            })),
            deprecated: subtag.deprecated,
            staff: subtag.staff,
            aliases: subtag.aliases,
            description: subtag.description?.[format](formatter)
        };
    }
}

import type { DumpService, Entities } from '@bbtag/blargbot';

import type { Cluster } from '../../Cluster.js';

export class ClusterDumpService implements DumpService {

    public constructor(public readonly cluster: Cluster) {
    }

    public async generateDumpPage(payload: Entities.MessageCreateOptions, channel: Entities.Channel): Promise<string> {
        // @ts-expect-error This is only a reference file for now
        const id = (await this.cluster.util.generateDumpPage(payload, channel)).toString();
        return this.cluster.util.websiteLink(`dumps/${id}`);

    }
}

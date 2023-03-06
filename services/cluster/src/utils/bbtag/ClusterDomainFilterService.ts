import type { DomainFilterService } from '@bbtag/blargbot';

import type { Cluster } from '../../Cluster.js';

export class ClusterDomainFilterService implements DomainFilterService {
    public constructor(public readonly cluster: Cluster) {
    }

    public canRequestDomain(domain: string): boolean {
        return this.cluster.domains.isWhitelisted(domain);
    }
}

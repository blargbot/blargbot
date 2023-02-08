import type { Cluster } from '@blargbot/cluster';
import { ClusterEventService } from '@blargbot/cluster/serviceTypes/index.js';

export class ClusterReloadTranslationsHandler extends ClusterEventService<'reloadTranslations'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'reloadTranslations', () => this.reloadTranslations());
    }

    protected async reloadTranslations(): Promise<void> {
        await this.cluster.util.translator.load();
    }
}

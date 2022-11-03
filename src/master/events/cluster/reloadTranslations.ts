import { ClusterConnection } from '@blargbot/cluster';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes/WorkerPoolEventService';

import { Master } from '../../Master';

export class ClusterReloadTranslationsHandler extends WorkerPoolEventService<ClusterConnection, 'reloadTranslations'> {
    readonly #master: Master;

    public constructor(
        master: Master
    ) {
        super(master.clusters, 'reloadTranslations', () => this.reloadTranslations());
        this.#master = master;
    }

    protected reloadTranslations(): void {
        this.#master.clusters.forEach((_, c) => c?.send('reloadTranslations', undefined));
    }
}

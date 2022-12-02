import { ClusterConnection } from '@blargbot/cluster';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes/WorkerPoolEventService.js';

import { Master } from '../../Master.js';

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

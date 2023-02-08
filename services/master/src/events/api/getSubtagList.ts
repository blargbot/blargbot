import type { ApiConnection } from '@blargbot/api';
import type { SubtagListResult } from '@blargbot/cluster/types.js';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes/index.js';
import type { Master } from '@blargbot/master';

export class ApiGetSubtagListHandler extends WorkerPoolEventService<ApiConnection, 'getSubtagList'> {
    #nextCluster: number;
    readonly #master: Master;

    public constructor(master: Master) {
        super(master.api, 'getSubtagList', async ({ reply }) => reply(await this.getSubtagList()));
        this.#nextCluster = 0;
        this.#master = master;
    }

    protected async getSubtagList(): Promise<SubtagListResult> {
        const cluster = this.#master.clusters.tryGet(this.#nextCluster);
        if (cluster === undefined) {
            if (this.#nextCluster === 0)
                throw new Error('No clusters are available');
            this.#nextCluster = 0;
            return await this.getSubtagList();
        }
        this.#nextCluster++;

        return await cluster.request('getSubtagList', undefined);
    }
}

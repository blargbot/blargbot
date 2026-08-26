import type { ApiConnection } from '@blargbot/api';
import type { SubtagDetails } from '@blargbot/cluster/types.js';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes/index.js';
import type { Master } from '@blargbot/master';

export class ApiGetSubtagHandler extends WorkerPoolEventService<ApiConnection, 'getSubtag'> {
    #nextCluster: number;
    readonly #master: Master;

    public constructor(master: Master) {
        super(
            master.api,
            'getSubtag',
            async ({ data, reply }) => reply(await this.getSubtag(data)));
        this.#nextCluster = 0;
        this.#master = master;
    }

    protected async getSubtag(name: string): Promise<SubtagDetails | undefined> {
        const cluster = this.#master.clusters.tryGet(this.#nextCluster);
        if (cluster === undefined) {
            if (this.#nextCluster === 0)
                throw new Error('No clusters are available');
            this.#nextCluster = 0;
            return await this.getSubtag(name);
        }
        this.#nextCluster++;

        return await cluster.request('getSubtag', name);
    }
}

import { ApiConnection } from '@api';
import { SubtagListResult } from '@cluster/types';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { Master } from '@master';

export class ApiGetSubtagListHandler extends WorkerPoolEventService<ApiConnection, 'getSubtagList'> {
    private nextCluster: number;

    public constructor(private readonly master: Master) {
        super(master.api, 'getSubtagList', async ({ reply }) => reply(await this.getSubtagList()));
        this.nextCluster = 0;
    }

    protected async getSubtagList(): Promise<SubtagListResult> {
        const cluster = this.master.clusters.tryGet(this.nextCluster);
        if (cluster === undefined) {
            if (this.nextCluster === 0)
                throw new Error('No clusters are available');
            this.nextCluster = 0;
            return await this.getSubtagList();
        }
        this.nextCluster++;

        return await cluster.request('getSubtagList', undefined);
    }
}

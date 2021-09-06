import { ApiConnection } from '@api';
import { SubtagDetails } from '@cluster/types';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { Master } from '@master';

export class ApiGetSubtagHandler extends WorkerPoolEventService<ApiConnection, 'getSubtag'> {
    private nextCluster: number;

    public constructor(private readonly master: Master) {
        super(
            master.api,
            'getSubtag',
            async ({ data, reply }) => reply(await this.getSubtag(data)));
        this.nextCluster = 0;
    }

    protected async getSubtag(name: string): Promise<SubtagDetails | undefined> {
        const cluster = this.master.clusters.tryGet(this.nextCluster);
        if (cluster === undefined) {
            if (this.nextCluster === 0)
                throw new Error('No clusters are available');
            this.nextCluster = 0;
            return await this.getSubtag(name);
        }
        this.nextCluster++;

        return await cluster.request('getSubtag', name);
    }
}

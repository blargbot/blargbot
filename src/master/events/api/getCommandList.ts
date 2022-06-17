import { ApiConnection } from '@blargbot/api';
import { CommandListResult } from '@blargbot/cluster/types';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes';
import { Master } from '@blargbot/master';

export class ApiGetCommandListHandler extends WorkerPoolEventService<ApiConnection, 'getCommandList'> {
    private nextCluster: number;

    public constructor(private readonly master: Master) {
        super(
            master.api,
            'getCommandList',
            async ({ reply }) => reply(await this.getCommandList()));
        this.nextCluster = 0;
    }

    protected async getCommandList(): Promise<CommandListResult> {
        const cluster = this.master.clusters.tryGet(this.nextCluster);
        if (cluster === undefined) {
            if (this.nextCluster === 0)
                throw new Error('No clusters are available');
            this.nextCluster = 0;
            return await this.getCommandList();
        }
        this.nextCluster++;

        return await cluster.request('getCommandList', undefined);
    }
}

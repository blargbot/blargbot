import { ApiConnection } from '@api';
import { ICommandDetails } from '@cluster/types';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { Master } from '@master';

export class ApiGetCommandHandler extends WorkerPoolEventService<ApiConnection, 'getCommand'> {
    private nextCluster: number;

    public constructor(private readonly master: Master) {
        super(
            master.api,
            'getCommand',
            async ({ data, reply }) => reply(await this.getCommand(data)));
        this.nextCluster = 0;
    }

    protected async getCommand(commandName: string): Promise<ICommandDetails | undefined> {
        const cluster = this.master.clusters.tryGet(this.nextCluster);
        if (cluster === undefined) {
            if (this.nextCluster === 0)
                throw new Error('No clusters are available');
            this.nextCluster = 0;
            return await this.getCommand(commandName);
        }
        this.nextCluster++;

        return await cluster.request('getCommand', commandName);
    }
}

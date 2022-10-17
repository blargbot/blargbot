import { ApiConnection } from '@blargbot/api';
import { CommandListResultItem } from '@blargbot/cluster/types';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes';
import { Master } from '@blargbot/master';

export class ApiGetCommandHandler extends WorkerPoolEventService<ApiConnection, `getCommand`> {
    #nextCluster: number;
    readonly #master: Master;

    public constructor(master: Master) {
        super(
            master.api,
            `getCommand`,
            async ({ data, reply }) => reply(await this.getCommand(data)));
        this.#nextCluster = 0;
        this.#master = master;
    }

    protected async getCommand(commandName: string): Promise<CommandListResultItem | undefined> {
        const cluster = this.#master.clusters.tryGet(this.#nextCluster);
        if (cluster === undefined) {
            if (this.#nextCluster === 0)
                throw new Error(`No clusters are available`);
            this.#nextCluster = 0;
            return await this.getCommand(commandName);
        }
        this.#nextCluster++;

        return await cluster.request(`getCommand`, commandName);
    }
}

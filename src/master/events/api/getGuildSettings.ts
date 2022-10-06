import { ApiConnection } from '@blargbot/api';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes';
import { GuildSettingDocs } from '@blargbot/domain/models';
import { Master } from '@blargbot/master';

export class ApiGetGuildSettingsHandler extends WorkerPoolEventService<ApiConnection, `getGuildSettings`> {
    #nextCluster: number;
    readonly #master: Master;

    public constructor(master: Master) {
        super(
            master.api,
            `getGuildSettings`,
            async ({ reply }) => reply(await this.getGuildSettings()));
        this.#nextCluster = 0;
        this.#master = master;
    }

    protected async getGuildSettings(): Promise<GuildSettingDocs> {
        const cluster = this.#master.clusters.tryGet(this.#nextCluster);
        if (cluster === undefined) {
            if (this.#nextCluster === 0)
                throw new Error(`No clusters are available`);
            this.#nextCluster = 0;
            return await this.getGuildSettings();
        }
        this.#nextCluster++;

        return await cluster.request(`getGuildSettings`, undefined);
    }
}

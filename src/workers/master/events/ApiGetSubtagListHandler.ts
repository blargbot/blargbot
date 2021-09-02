import { ApiConnection } from '@api';
import { SubtagDetails, SubtagListResult } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { mapping } from '@core/utils';
import { Master } from '@master';

export class ApiGetSubtagListHandler extends WorkerPoolEventService<ApiConnection, unknown, SubtagListResult> {
    private nextCluster: number;

    public constructor(private readonly master: Master) {
        super(
            master.api,
            'getSubtagList',
            mapping.mapUnknown,
            async ({ reply }) => reply(await this.getSubtagList())
        );
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

        const response = await cluster.request('getSubtagList', undefined);
        const mapped = mapSubtagListResult(response);
        if (mapped.valid)
            return mapped.value;

        this.master.logger.error(`Cluster ${this.nextCluster - 1} returned an invalid response to 'getSubtagList'`, response);
        return {};
    }
}

const mapSubtagListResult = mapping.mapRecord(mapping.mapObject<SubtagDetails>({
    aliases: mapping.mapArray(mapping.mapString),
    category: mapping.mapIn(...Object.values(SubtagType)),
    deprecated: mapping.mapChoice(mapping.mapBoolean, mapping.mapString),
    name: mapping.mapString,
    staff: mapping.mapBoolean,
    signatures: mapping.mapFake
}));

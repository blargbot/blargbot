import { ApiConnection } from '@api';
import { SubtagDetails } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { mapping } from '@core/utils';
import { Master } from '@master';

export class ApiGetSubtagHandler extends WorkerPoolEventService<ApiConnection, string, SubtagDetails | undefined> {
    private nextCluster: number;

    public constructor(private readonly master: Master) {
        super(
            master.api,
            'getSubtag',
            mapping.mapString,
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

        const response = await cluster.request('getSubtag', name);
        const mapped = mapSubtagDetails(response);
        if (mapped.valid)
            return mapped.value;

        this.master.logger.error(`Cluster ${this.nextCluster - 1} returned an invalid response to 'getSubtag'`, response);
        return undefined;
    }
}

const mapSubtagDetails = mapping.mapChoice(
    mapping.mapIn(undefined),
    mapping.mapObject<SubtagDetails>({
        aliases: mapping.mapArray(mapping.mapString),
        category: mapping.mapIn(...Object.values(SubtagType)),
        deprecated: mapping.mapChoice(mapping.mapBoolean, mapping.mapString),
        name: mapping.mapString,
        staff: mapping.mapBoolean,
        signatures: mapping.mapFake
    })
);

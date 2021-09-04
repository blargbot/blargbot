import { ApiConnection } from '@api';
import { CommandListResult, FlagDefinition, ICommandDetails } from '@cluster/types';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { guard, mapping } from '@core/utils';
import { Master } from '@master';

export class ApiGetCommandListHandler extends WorkerPoolEventService<ApiConnection, unknown, CommandListResult> {
    private nextCluster: number;

    public constructor(private readonly master: Master) {
        super(
            master.api,
            'getCommandList',
            mapping.mapUnknown,
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

        const response = await cluster.request('getCommandList', undefined);
        const mapped = mapCommandListResult(response);
        if (mapped.valid)
            return mapped.value;

        this.master.logger.error(`Cluster ${this.nextCluster - 1} returned an invalid response to 'getCommandList'`, response);
        return {};
    }
}

const mapCommandListResult = mapping.mapRecord(mapping.mapObject<ICommandDetails>({
    aliases: mapping.mapArray(mapping.mapString),
    category: mapping.mapString,
    description: mapping.mapOptionalString,
    flags: mapping.mapArray(mapping.mapObject<FlagDefinition>({
        description: mapping.mapString,
        flag: mapping.mapGuard((v): v is Letter => typeof v === 'string' && guard.isLetter(v)),
        word: mapping.mapString
    })),
    hidden: mapping.mapBoolean,
    name: mapping.mapString,
    signatures: mapping.mapFake,
    disabled: mapping.mapBoolean,
    permission: mapping.mapString,
    roles: mapping.mapArray(mapping.mapString)
}));

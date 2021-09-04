import { ApiConnection } from '@api';
import { FlagDefinition, ICommandDetails } from '@cluster/types';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { guard, mapping } from '@core/utils';
import { Master } from '@master';

export class ApiGetCommandHandler extends WorkerPoolEventService<ApiConnection, string, ICommandDetails | undefined> {
    private nextCluster: number;

    public constructor(private readonly master: Master) {
        super(
            master.api,
            'getCommand',
            mapping.mapString,
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

        const response = await cluster.request('getCommand', commandName);
        const mapped = mapCommandDetails(response);
        if (mapped.valid)
            return mapped.value;

        this.master.logger.error(`Cluster ${this.nextCluster - 1} returned an invalid response to 'getCommand'`, response);
        return undefined;
    }
}

const mapCommandDetails = mapping.mapChoice(
    mapping.mapIn(undefined),
    mapping.mapObject<ICommandDetails>({
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
    })
);

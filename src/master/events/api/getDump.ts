import { ApiConnection } from '@blargbot/api';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes';
import { ParsedDump } from '@blargbot/core/types';
import { Master } from '@blargbot/master';

export class ApiGetDumpHandler extends WorkerPoolEventService<ApiConnection, 'getDump'> {
    public constructor(private readonly master: Master) {
        super(
            master.api,
            'getDump',
            async ({ data, reply }) => reply(await this.getDump(data)));
    }

    protected async getDump(id: string): Promise<ParsedDump | undefined> {
        const dump = await this.master.database.dumps.getById(id);
        this.master.logger.info('Dump: ', dump);
        return dump;
    }
}

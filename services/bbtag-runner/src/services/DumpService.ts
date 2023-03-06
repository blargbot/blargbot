import type { DumpService as BBTagDumpService, Entities } from '@bbtag/blargbot';

export class DumpService implements BBTagDumpService {
    public generateDumpPage(payload: Entities.MessageCreateOptions, channel: Entities.Channel): Promise<string> {
        payload;
        channel;
        throw new Error('Method not implemented.');
    }
}

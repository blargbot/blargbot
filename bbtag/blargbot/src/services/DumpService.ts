import type { Entities } from '../types.js';

export interface DumpService {
    generateDumpPage(payload: Entities.MessageCreateOptions, channel: Entities.Channel): Promise<string>;
}

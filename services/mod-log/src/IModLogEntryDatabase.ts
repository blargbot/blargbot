import type { ModLogCreateRequest, ModLogDeleteRequest, ModLogUpdateRequest } from '@blargbot/mod-log-client';

import type { ModLogEntry } from './ModLogEntry.js';

export interface IModLogEntryDatabase {
    create(options: ModLogCreateRequest): Awaitable<ModLogEntry>;
    update(options: ModLogUpdateRequest): Awaitable<ModLogEntry | undefined>;
    delete(options: ModLogDeleteRequest): Awaitable<ModLogEntry | undefined>;
}

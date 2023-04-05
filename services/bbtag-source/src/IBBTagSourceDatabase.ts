import type { BBTagSource, BBTagSourceFilter, BBTagSourceIndex } from '@blargbot/bbtag-source-client';

export interface IBBTagSourceDatabase {
    get(key: BBTagSourceIndex): Awaitable<BBTagSource | undefined>;
    set(key: BBTagSourceIndex, source: Partial<BBTagSource>): Awaitable<boolean>;
    delete(key: BBTagSourceFilter): Awaitable<void>;
    alias(alias: BBTagSourceIndex, source: BBTagSourceIndex): Awaitable<void>;
}

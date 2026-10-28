import type { Logger } from '@blargbot/logger';
import type { sleep } from '@blargbot/util';

import type { Subtag } from './Subtag.js';
import type { VariablesProvider } from './Variables.js';

export interface InjectionContext {
    readonly botId: string;
    readonly logger: Logger;
    readonly subtags: Iterable<Subtag>;
    readonly util: BBTagUtilities;
    readonly variables: VariablesProvider;
    readonly sleep: typeof sleep;
}

export interface BBTagUtilities {
    getChannelGuild(channelId: string): Promise<string | undefined>;
    getMessageAuthor(channelId: string, messageId: string): Promise<string | undefined>;
}

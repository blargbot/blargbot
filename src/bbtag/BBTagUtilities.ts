import type { ChoiceQueryResult, EntityPickQueryOptions } from '@blargbot/core';
import type { Logger } from '@blargbot/logger';
import type { sleep } from '@blargbot/util';
import type * as eris from 'eris';

import type { Subtag } from './Subtag.js';
import type { VariablesProvider } from './Variables.js';

export interface InjectionContext {
    readonly discord: eris.Client;
    readonly logger: Logger;
    readonly subtags: Iterable<Subtag>;
    readonly util: BBTagUtilities;
    readonly variables: VariablesProvider;
    readonly sleep: typeof sleep;
}

export interface BBTagSendContent extends Omit<eris.AdvancedMessageContent, 'embed' | 'messageReferenceID'> {
    file?: eris.FileContent[];
    nsfw?: string;
}

export interface BBTagUtilities {
    send<T extends eris.TextableChannel>(channel: T, payload: BBTagSendContent, author?: eris.User): Promise<eris.Message<T> | undefined>;

    getChannel(channelId: string): Promise<eris.KnownChannel | undefined>;
    getMessage(channel: string, messageId: string, force?: boolean): Promise<eris.KnownMessage | undefined>;

    getUser(userId: string): Promise<eris.User | undefined>;
    getMember(guild: string | eris.Guild, userId: string): Promise<eris.Member | undefined>;
    findMembers(guild: string | eris.Guild, query?: string): Promise<eris.Member[]>;
    queryMember(options: EntityPickQueryOptions<string, eris.Member>): Promise<ChoiceQueryResult<eris.Member>>;

    getRole(guild: string | eris.Guild, roleId: string): Promise<eris.Role | undefined>;
    findRoles(guild: string | eris.Guild, query?: string): Promise<eris.Role[]>;
    queryRole(options: EntityPickQueryOptions<string, eris.Role>): Promise<ChoiceQueryResult<eris.Role>>;

}

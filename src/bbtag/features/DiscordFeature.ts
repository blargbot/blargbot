import { ChoiceQueryResult, EntityPickQueryOptions } from '@blargbot/core/types';
import { Client as Discord, Guild, KnownChannel, KnownMessage, Member, Role, User } from 'eris';

import { VariableReference } from '../Caching';
import { FindEntityOptions } from '../types';

export abstract class DiscordProvider {
    public abstract readonly client: Discord;
}

export abstract class MessageProvider {
    public abstract readonly current: KnownMessage;
}

export abstract class UserProvider {
    public abstract readonly current: User;
    public abstract query(query: string | undefined, options?: FindEntityOptions): Promise<User | undefined>
}

export abstract class MemberProvider {
    public abstract readonly current: Member;
    public abstract query(query: string | undefined, options?: FindEntityOptions): Promise<Member | undefined>
}

export abstract class GuildProvider {
    public abstract readonly current: Guild;
}

export abstract class RoleProvider {
    public abstract query(query: string | undefined, options?: FindEntityOptions): Promise<Role | undefined>
}

export abstract class ChannelProvider {
    public abstract readonly current: KnownChannel;
    public abstract query(query: string | undefined, options?: FindEntityOptions): Promise<KnownChannel | undefined>
}

export abstract class QueryProvider {
    public abstract query<T extends { [P in I]: K; }, I extends PropertyKey, K>(
        query: string,
        type: string,
        idName: I,
        get: (id: K) => Promise<T | undefined>,
        find: (query: string) => Promise<T[]>,
        pick: (options: EntityPickQueryOptions<T>) => Promise<ChoiceQueryResult<T>>,
        options: FindEntityOptions
    ): Promise<T | undefined>
}

export abstract class VariableProvider {
    public abstract get(variable: string): Promise<VariableReference>;
    public abstract set(variable: string, value: JToken | undefined): Promise<void>;
    public abstract reset(variables?: string[]): void;
    public abstract persist(variables?: string[]): Promise<void>;
}

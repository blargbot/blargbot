import type { FlagDefinition } from '@blargbot/flags';

import type { GuildCommandTagBase } from './GuildCommandTagBase.js';

export interface GuildSourceCommandTag extends GuildCommandTagBase {
    readonly flags?: ReadonlyArray<FlagDefinition<string>>;
    readonly content: string;
}

export interface NamedGuildSourceCommandTag extends GuildSourceCommandTag {
    readonly name: string;
}

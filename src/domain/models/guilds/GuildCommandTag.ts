import type { GuildImportedCommandTag, NamedGuildImportedCommandTag } from './GuildImportedCommandTag.js';
import type { GuildSourceCommandTag, NamedGuildSourceCommandTag } from './GuildSourceCommandTag.js';

export type GuildCommandTag = GuildImportedCommandTag | GuildSourceCommandTag;
export type NamedGuildCommandTag = NamedGuildImportedCommandTag | NamedGuildSourceCommandTag;

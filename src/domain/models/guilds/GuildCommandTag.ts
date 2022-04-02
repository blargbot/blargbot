import { GuildImportedCommandTag, NamedGuildImportedCommandTag } from './GuildImportedCommandTag';
import { GuildSourceCommandTag, NamedGuildSourceCommandTag } from './GuildSourceCommandTag';

export type GuildCommandTag = GuildImportedCommandTag | GuildSourceCommandTag;
export type NamedGuildCommandTag = NamedGuildImportedCommandTag | NamedGuildSourceCommandTag;

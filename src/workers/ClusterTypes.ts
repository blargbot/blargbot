import { Shard } from 'eris';
import { SubtagType, CommandType, FlagDefinition } from '../utils';
import { SubtagArgument } from '../core/bbtag/BaseSubtagHandler';

export interface LookupChannelResult {
    channel: string;
    guild: string
}

export interface GetStaffGuildsRequest {
    user: string;
    guilds: string[];
}

export interface ClusterRespawnRequest {
    id?: number;
    channel: string;
}

export interface TagListResult {
    [tagName: string]: TagResult | undefined;
}

export interface TagResult {
    readonly category: SubtagType;
    readonly name: string;
    readonly args: readonly SubtagArgument[];
    readonly desc: string;
    readonly exampleCode: string | null;
    readonly exampleIn: string | null;
    readonly exampleOut: string | null;
    readonly deprecated: false | string;
    readonly staff: boolean;
    readonly aliases: readonly string[];
}

export interface CommandListResult {
    [commandName: string]: CommandResult | undefined;
}

export interface CommandResult {
    readonly name: string;
    readonly usage: string;
    readonly info: string;
    readonly category: CommandType;
    readonly aliases: readonly string[];
    readonly flags: readonly FlagDefinition[];
    readonly onlyOn: string | null;
}

export interface ClusterStats {
    readonly id: number;
    readonly time: number;
    readonly readyTime: number;
    readonly guilds: number;
    readonly rss: number;
    readonly userCpu: number;
    readonly systemCpu: number;
    readonly shardCount: number;
    readonly shards: readonly ShardStats[]
}

export interface ShardStats {
    readonly id: number;
    readonly status: Shard['status'];
    readonly latency: number;
    readonly guilds: number;
    readonly cluster: number;
    readonly time: number;
}
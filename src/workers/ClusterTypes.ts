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

export interface TagListResult {
    [tagName: string]: TagResult | undefined;
}

export interface TagResult {
    category: SubtagType;
    name: string;
    args: SubtagArgument[];
    desc: string;
    exampleCode: string | null;
    exampleIn: string | null;
    exampleOut: string | null;
    deprecated: boolean;
    staff: boolean;
    aliases: string[];
}

export interface CommandListResult {
    [commandName: string]: CommandResult | undefined;
}

export interface CommandResult {
    name: string;
    usage: string;
    info: string;
    longinfo: string | null;
    category: CommandType;
    aliases: string[];
    flags: FlagDefinition[];
    onlyOn: string | null;
}

export interface ClusterStats {
    id: number;
    time: number;
    readyTime: number;
    guilds: number;
    rss: number;
    userCpu: number;
    systemCpu: number;
    shardCount: number;
    shards: ShardStats[]
}

export interface ShardStats {
    id: number;
    status: Shard['status'];
    latency: number;
    guilds: number;
    cluster: number;
    time: number;
}
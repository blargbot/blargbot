import type { Snowflake } from './Snowflake.js';

export interface Dump {
    readonly id: Snowflake;
    readonly content?: string;
    readonly embeds?: object[];
    readonly channelid: Snowflake;
    readonly expiry: number;
}

import { Snowflake } from './Snowflake';

export interface Dump {
    readonly id: Snowflake;
    readonly content?: string;
    readonly embeds?: object[];
    readonly channelid: Snowflake;
    readonly expiry: number;
}

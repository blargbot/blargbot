export interface DiscordGatewayMessage<Payload> {
    readonly payload: Payload;
    readonly shard: number;
    readonly lastShard: number;
}

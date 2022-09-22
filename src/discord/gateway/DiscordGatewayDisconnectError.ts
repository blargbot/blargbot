import { GatewayCloseCodes } from 'discord-api-types/v10';

export class DiscordGatewayDisconnectError extends Error {
    public readonly code: number | undefined;
    public readonly reconnectable: boolean;

    public constructor(code: number | undefined) {
        const reason = closeCodeMessages[code ?? 0] ?? { text: 'Unknown close code', reconnectable: true };
        super(`Connection terminated with code ${code ?? '-'}:\n${reason.text}`);

        this.code = code;
        this.reconnectable = reason.reconnectable;
    }
}

const closeCodeMessages: Record<number, { text: string; reconnectable: boolean; } | undefined> = {
    [GatewayCloseCodes.AlreadyAuthenticated]: { text: 'Already authenticated', reconnectable: true },
    [GatewayCloseCodes.AuthenticationFailed]: { text: 'Authentication failed', reconnectable: false },
    [GatewayCloseCodes.DecodeError]: { text: 'Decode error', reconnectable: true },
    [GatewayCloseCodes.DisallowedIntents]: { text: 'Disallowed intents', reconnectable: false },
    [GatewayCloseCodes.InvalidAPIVersion]: { text: 'Invalid api version', reconnectable: false },
    [GatewayCloseCodes.InvalidIntents]: { text: 'Invalid intents', reconnectable: false },
    [GatewayCloseCodes.InvalidSeq]: { text: 'Invalid sequence number', reconnectable: true },
    [GatewayCloseCodes.InvalidShard]: { text: 'Invalid shard', reconnectable: false },
    [GatewayCloseCodes.NotAuthenticated]: { text: 'Not authenticated', reconnectable: true },
    [GatewayCloseCodes.RateLimited]: { text: 'Ratelimited', reconnectable: true },
    [GatewayCloseCodes.SessionTimedOut]: { text: 'Session timed out', reconnectable: false },
    [GatewayCloseCodes.ShardingRequired]: { text: 'Sharding required', reconnectable: false },
    [GatewayCloseCodes.UnknownError]: { text: 'Unknown error', reconnectable: true },
    [GatewayCloseCodes.UnknownOpcode]: { text: 'Unknown opcode', reconnectable: true },
    1000: { text: 'Client closed connection', reconnectable: true },
    1001: { text: 'Client closed connection', reconnectable: true },
    1002: { text: 'Protocol error', reconnectable: true },
    1003: { text: 'Unreadable content', reconnectable: true },
    1005: { text: 'Close code missing', reconnectable: true },
    1006: { text: 'Abnormal close', reconnectable: true },
    1007: { text: 'Message content conflict', reconnectable: true },
    1008: { text: 'Generic error', reconnectable: true },
    1010: { text: 'Missing extension', reconnectable: true },
    1011: { text: 'Unexpected condition', reconnectable: true },
    1015: { text: 'TLS Handshake failed', reconnectable: true },
    4901: { text: 'Client is reconnecting', reconnectable: true },
    4902: { text: 'Connection timed out', reconnectable: true }
} as Record<GatewayCloseCodes, { text: string; reconnectable: boolean; }>;

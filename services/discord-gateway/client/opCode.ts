import Discord from '@blargbot/discord-types';
import type { ConsumeMessage, MessageHandle } from '@blargbot/message-hub';

import type { HandleGatewayEventOptions, SnakeCaseToPascalCase } from './types.js';

type OpCodeToNameMap = { [P in Discord.GatewayOpcodes]: typeof opCodeToNameMap[P] };
const opCodeToNameMap = {
    [Discord.GatewayOpcodes.Dispatch]: 'DISPATCH',
    [Discord.GatewayOpcodes.Heartbeat]: 'HEARTBEAT',
    [Discord.GatewayOpcodes.HeartbeatAck]: 'HEARTBEAT_ACK',
    [Discord.GatewayOpcodes.Hello]: 'HELLO',
    [Discord.GatewayOpcodes.Identify]: 'IDENTIFY',
    [Discord.GatewayOpcodes.InvalidSession]: 'INVALID_SESSION',
    [Discord.GatewayOpcodes.PresenceUpdate]: 'PRESENCE_UPDATE',
    [Discord.GatewayOpcodes.Reconnect]: 'RECONNECT',
    [Discord.GatewayOpcodes.RequestGuildMembers]: 'REQUEST_GUILD_MEMBERS',
    [Discord.GatewayOpcodes.Resume]: 'RESUME',
    [Discord.GatewayOpcodes.VoiceStateUpdate]: 'VOICE_STATE_UPDATE'
} as const satisfies { [P in Discord.GatewayOpcodes]: string };

type NameToOpCodeMap = { [P in keyof OpCodeToNameMap as OpCodeToNameMap[P]]: P };
export const nameToOpCodeMap = Object.fromEntries(Object.entries(opCodeToNameMap).map(x => [x[1], x[0]])) as NameToOpCodeMap;

export type ReceiveOpCodeMap = { [P in Discord.GatewayReceivePayload as OpCodeToNameMap[P['op']]]: P };
export type OpCodeHandlerName<OpCode extends keyof ReceiveOpCodeMap> = `handle${SnakeCaseToPascalCase<OpCode>}`;
export type OpCodeHandler<OpCode extends keyof ReceiveOpCodeMap> = (...args: OpCodeHandlerArgs<OpCode>) => Promise<MessageHandle>;
export type OpCodeHandlerArgs<OpCode extends keyof ReceiveOpCodeMap> = [
    handler: (data: ReceiveOpCodeMap[OpCode]['d'], shard: [id: number, lastId: number], payload: ReceiveOpCodeMap[OpCode], msg: ConsumeMessage) => Awaitable<void>,
    options?: HandleGatewayEventOptions
]

import Discord from '@blargbot/discord-types';
import type { ConsumeMessage, MessageHandle } from '@blargbot/message-hub';

import type { DispatchMap } from './dispatch.js';
import type { HandleGatewayEventOptions, SnakeCaseToPascalCase } from './types.js';

type OpCodeToNameMap = { [P in Discord.GatewayOpcodes]: typeof opCodeToNameMap[P] };
const opCodeToNameMap = {
    [Discord.GatewayOpcodes.Dispatch]: 'DISPATCH',
    [Discord.GatewayOpcodes.Heartbeat]: 'HEARTBEAT',
    [Discord.GatewayOpcodes.HeartbeatAck]: 'HEARTBEAT_ACK',
    [Discord.GatewayOpcodes.Hello]: 'HELLO',
    [Discord.GatewayOpcodes.Identify]: 'IDENTIFY',
    [Discord.GatewayOpcodes.InvalidSession]: 'INVALID_SESSION',
    [Discord.GatewayOpcodes.PresenceUpdate]: 'UPDATE_PRESENCE',
    [Discord.GatewayOpcodes.Reconnect]: 'RECONNECT',
    [Discord.GatewayOpcodes.RequestGuildMembers]: 'REQUEST_GUILD_MEMBERS',
    [Discord.GatewayOpcodes.Resume]: 'RESUME',
    [Discord.GatewayOpcodes.VoiceStateUpdate]: 'UPDATE_VOICE_STATE'
} as const satisfies { [P in Discord.GatewayOpcodes]: string };

export type SendOpCode = OpCodeToNameMap[Discord.GatewaySendPayload['op']];
export const sendOpCodes = Object.freeze(Object.keys<SendOpCode>({
    HEARTBEAT: null,
    IDENTIFY: null,
    REQUEST_GUILD_MEMBERS: null,
    RESUME: null,
    UPDATE_PRESENCE: null,
    UPDATE_VOICE_STATE: null
}));

export type ReceiveOpCode = OpCodeToNameMap[Discord.GatewayReceivePayload['op']];
export const receiveOpCodes = Object.freeze(Object.keys<ReceiveOpCode>({
    DISPATCH: null,
    HEARTBEAT: null,
    HEARTBEAT_ACK: null,
    HELLO: null,
    INVALID_SESSION: null,
    RECONNECT: null
}));

type NameToOpCodeMap = { [P in keyof OpCodeToNameMap as OpCodeToNameMap[P]]: P };
export const nameToOpCodeMap = Object.fromEntries(
    Object.entries(opCodeToNameMap).map(x => [x[1], x[0]])
) as NameToOpCodeMap satisfies { [P in keyof DispatchMap & keyof OpCodeMap]: 'DispatchMap and OpCodeMap have a conflicting event name' };

export type OpCodeMap = { [P in Discord.GatewaySendPayload | Discord.GatewayReceivePayload as OpCodeToNameMap[P['op']]]: P };
export type OpCodeHandlerName<OpCode extends keyof OpCodeMap> = `handle${SnakeCaseToPascalCase<OpCode>}`;
export type OpCodeHandler<OpCode extends keyof OpCodeMap> = (...args: OpCodeHandlerArgs<OpCode>) => Promise<MessageHandle>;
export type OpCodeHandlerArgs<OpCode extends keyof OpCodeMap> = [
    handler: (data: OpCodeMap[OpCode]['d'], shard: [id: number, lastId: number], payload: OpCodeMap[OpCode], msg: ConsumeMessage) => Awaitable<void>,
    options?: HandleGatewayEventOptions
]

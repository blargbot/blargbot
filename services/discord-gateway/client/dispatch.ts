import type Discord from '@blargbot/discord-types';
import type { ConsumeMessage, MessageHandle } from '@blargbot/message-hub';

import type { HandleGatewayEventOptions, SnakeCaseToPascalCase } from './types.js';

export type DispatchMap = { [P in Discord.GatewayDispatchPayload as `${P['t']}`]: P };
export type DispatchHandlerName<Dispatch extends keyof DispatchMap> = `handle${SnakeCaseToPascalCase<Dispatch>}`;
export type DispatchHandler<Dispatch extends keyof DispatchMap> = (...args: DispatchHandlerArgs<Dispatch>) => Promise<MessageHandle>;
export type DispatchHandlerArgs<Dispatch extends keyof DispatchMap> = [
    handler: (data: DispatchMap[Dispatch]['d'], shard: [id: number, lastId: number], payload: DispatchMap[Dispatch], msg: ConsumeMessage) => Awaitable<void>,
    options?: HandleGatewayEventOptions
]

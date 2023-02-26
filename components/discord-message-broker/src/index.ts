import type { ConsumeMessage, HandleMessageOptions, MessageHandle } from '@blargbot/message-broker';
import type MessageBroker from '@blargbot/message-broker';
import type amqplib from 'amqplib';
import Discord from '@blargbot/discord-types';

export interface DiscordMessageBrokerMixinType<
    Events extends readonly DispatchEvent[],
    Type extends abstract new (...args: never) => MessageBroker
> {
    new(...args: ConstructorParameters<Type>): DiscordMessageBrokerMixin<Events, Type>;
}

export interface DiscordMessageBrokerMixinOptions<
    Events extends readonly DispatchEvent[],
    Type extends abstract new (...args: never) => MessageBroker
> {
    readonly type: Type;
    readonly events: Events;
    readonly serviceName: string;
    readonly eventExchange: string;
}

export type DiscordMessageBrokerMixin<Events extends readonly DispatchEvent[], Type extends abstract new (...args: never) => MessageBroker> = InstanceType<Type> & {
    [P in Events[number]as `handle${SnakeCaseToPascalCase<P>}`]: HandleMessageFunction<P, InstanceType<Type>>
}

export function discordMessageBrokerMixin<
    Events extends [] | readonly DispatchEvent[],
    Type extends abstract new (...args: never) => Instance,
    Instance extends MessageBroker
>(options: DiscordMessageBrokerMixinOptions<Events, Type>): DiscordMessageBrokerMixinType<Events, Type> {
    const { type, eventExchange, serviceName } = options;
    // @ts-expect-error Not sure why I must provide a constructor definition?
    class DiscordMessageBrokerMixin extends type {
        public override async onceConnected(channel: amqplib.Channel): Promise<void> {
            await channel.assertExchange(eventExchange, 'topic', { durable: true });
        }
    }

    for (const event of options.events) {
        const handlerName = `handle${snakeCaseToPascalCase(event)}`;
        Object.defineProperty(DiscordMessageBrokerMixin.prototype, handlerName, {
            value: async function (this: Instance, handler: (message: DispatchEventTypeConfig[typeof event], msg: ConsumeMessage) => Awaitable<void>, options?: HandleGatewayEventOptions<Instance>): Promise<MessageHandle> {
                return await this.handleMessage({
                    ...options,
                    exchange: eventExchange,
                    queue: `${event}[${serviceName}]`,
                    filter: `*.${Discord.GatewayOpcodes.Dispatch}.${event}`,
                    handle: async (data, msg) => {
                        const message = await this.blobToJson<{ event: { d: DispatchEventTypeConfig[typeof event]; }; }>(data);
                        await handler(message.event.d, msg);
                    }
                });
            }
        });
    }

    return DiscordMessageBrokerMixin as unknown as DiscordMessageBrokerMixinType<Events, Type>;
}

type HandleGatewayEventOptions<This> = Omit<HandleMessageOptions<This>, 'queue' | 'exchange' | 'filter' | 'handle'>;

interface HandleMessageFunction<Event extends DispatchEvent, This> {
    (this: This, handler: (message: DispatchEventTypeConfig[Event], msg: ConsumeMessage) => Awaitable<void>, options?: HandleGatewayEventOptions<This>): Promise<MessageHandle>;
}

type DispatchEvent = keyof DispatchEventTypeConfig;
type DispatchEventTypeConfig = { [P in Discord.GatewayDispatchPayload as `${P['t']}`]: P['d'] };

type SnakeCaseToPascalCase<Input extends string> =
    Input extends `${infer A}_${infer B}`
    ? `${UppercaseFirst<Lowercase<A>>}${SnakeCaseToPascalCase<B>}`
    : UppercaseFirst<Lowercase<Input>>

function snakeCaseToPascalCase<Input extends string>(input: Input): SnakeCaseToPascalCase<Input>
function snakeCaseToPascalCase(input: string): string {
    return input.toLowerCase().split('_').map(x => `${x.slice(0, 1).toUpperCase()}${x.slice(1)}`).join('');
}

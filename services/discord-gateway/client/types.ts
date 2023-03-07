import type { HandleMessageOptions } from '@blargbot/message-hub';

export type HandleGatewayEventOptions = Omit<HandleMessageOptions, 'queue' | 'exchange' | 'filter' | 'handle'> & {
    shard?: [id: number, last: number];
};
export type SnakeCaseToPascalCase<Input extends string> =
    Input extends `${infer A}_${infer B}`
    ? `${UppercaseFirst<Lowercase<A>>}${SnakeCaseToPascalCase<B>}`
    : UppercaseFirst<Lowercase<Input>>

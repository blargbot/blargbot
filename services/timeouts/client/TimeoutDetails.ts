import { json } from '@blargbot/serialization';
import type * as amqplib from 'amqplib';

export interface TimeoutDetails {
    readonly id: string;
    readonly display: string;
    readonly userId: bigint;
    readonly ownerId: bigint;
    readonly start: Date;
    readonly end: Date;
    readonly queue: string;
    readonly data: Buffer;
    readonly dataType: string;
    readonly options: amqplib.Options.Publish;
}

export const timeoutDetailsSerializerOpts = {
    id: json.string,
    display: json.string,
    userId: json.bigint,
    ownerId: json.bigint,
    start: json.date,
    end: json.date,
    queue: json.string,
    data: json.buffer,
    dataType: json.string,
    options: json.object<amqplib.Options.Publish>({
        appId: json.string.optional,
        BCC: json.choice(json.string, json.array(json.string)).optional,
        CC: json.choice(json.string, json.array(json.string)).optional,
        contentEncoding: json.string.optional,
        contentType: json.string.optional,
        correlationId: json.string.optional,
        deliveryMode: json.choice(json.number, json.boolean).optional,
        expiration: json.string.optional,
        headers: json.unknown,
        mandatory: json.boolean.optional,
        messageId: json.string.optional,
        persistent: json.boolean.optional,
        priority: json.number.optional,
        replyTo: json.string.optional,
        timestamp: json.number.optional,
        type: json.string.optional,
        userId: json.string.optional
    })
};

export const timeoutDetailsCreateSerializerOpts = omit(timeoutDetailsSerializerOpts, 'id', 'ownerId');

export const timeoutDetailsSerializer = json.object<TimeoutDetails>(timeoutDetailsSerializerOpts);
export const timeoutDetailsCreateSerializer = json.object<Omit<TimeoutDetails, 'id' | 'ownerId'>>(timeoutDetailsCreateSerializerOpts);

function omit<T, Props extends keyof T>(source: T, ...props: Props[]): Omit<T, Props> {
    const res = { ...source };
    for (const prop of props)
        delete res[prop];
    return res;
}

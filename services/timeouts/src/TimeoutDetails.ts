import type { IJsonConverterType } from '@blargbot/serialization';
import { json } from '@blargbot/serialization';
import type * as amqplib from 'amqplib';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TimeoutDetails extends Readonly<IJsonConverterType<typeof timeoutDetailsSerializer>> {

}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TimeoutRecord extends Readonly<IJsonConverterType<typeof timeoutRecordSerializer>> {

}

export const timeoutDetailsSerializerOpts = {
    id: json.string,
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

export const timeoutRecordSerializerOpts = {
    display: json.string,
    userId: json.bigint,
    ownerId: json.bigint,
    start: json.date.optional,
    end: json.date,
    ...timeoutDetailsSerializerOpts
};

export const timeoutDetailsSerializer = json.object(timeoutDetailsSerializerOpts);
export const timeoutRecordSerializer = json.object(timeoutRecordSerializerOpts);

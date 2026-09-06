import type { Channel } from 'amqplib';
import z from 'zod';

import AmqpMessage from '../messages/AmqpMessage.js';
import { asBuffer, asUint8Array } from '../util.js';
import { defineDirectExchange, type DirectExchange } from './defineDirectExchange.js';

export type ConfigExchange = DirectExchange<{
    ['set-discord-token']: string;
}>;

export async function getConfigExchange(channel: Channel): Promise<ConfigExchange> {
    return await defineDirectExchange(
        channel,
        'config',
        {
            'set-discord-token': stringMessage
        }
    );
}

const stringMessage = z.codec(
    AmqpMessage,
    z.string(),
    {
        encode(value) {
            return {
                content: asUint8Array(Buffer.from(value)),
                contentEncoding: 'utf-8' as const,
                contentType: 'text/plain'
            };
        },
        decode(value) {
            return asBuffer(value.content).toString(value.contentEncoding);
        }
    }
);

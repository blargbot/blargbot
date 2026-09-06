import z from 'zod';

import { bufferToJson, jsonToBuffer } from '../util.js';
import AmqpMessage from './AmqpMessage.js';

const output = z.object({
    status: z.int(),
    statusText: z.string().optional(),
    body: z.unknown()
});

type DiscordResponse = z.infer<typeof DiscordResponse>;
// eslint-disable-next-line @typescript-eslint/naming-convention
const DiscordResponse = z.codec(
    AmqpMessage,
    output,
    {
        encode(value) {
            return {
                content: jsonToBuffer(value),
                contentType: 'application/json',
                contentEncoding: 'utf-8' as const
            };
        },
        decode(value) {
            return output.parse(bufferToJson(value.content, value.contentEncoding));
        }
    }
);
export default DiscordResponse;

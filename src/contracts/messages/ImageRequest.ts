import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ImageRequest = amqpJsonCodec(z.discriminatedUnion(
    'type',
    [
        z.object({
            type: z.literal(['truth', 'clyde', 'clippy', 'delete', 'pccheck', 'sonicsays', 'thesearch']),
            text: z.string()
        }),
        z.object({
            type: z.literal(['starVsTheForcesOf', 'distort', 'art', 'clint', 'linus']),
            imageUrl: z.url()
        }),
        z.object({
            type: z.literal('stupid'),
            imageUrl: z.url().optional(),
            text: z.string()
        }),
        z.object({
            type: z.literal('pixelate'),
            imageUrl: z.url(),
            scale: z.number()
        }),
        z.object({
            type: z.literal('free'),
            top: z.string(),
            bottom: z.string().optional()
        }),
        z.object({
            type: z.literal('caption'),
            imageUrl: z.url(),
            top: z.string().optional(),
            bottom: z.string().optional(),
            font: z.literal([
                'ARCENA.ttf',
                'arial.ttf',
                'animeace.ttf',
                'AnnieUseYourTelescope.ttf',
                'comicjens.ttf',
                'impact.ttf',
                'SFToontime.ttf',
                'delius.ttf',
                'IndieFlower.ttf',
                'Roboto-Regular.ttf',
                'Ubuntu-Regular.ttf',
                'comicsans.ttf',
                'whitney.ttf'
            ])
        }),
        z.object({
            type: z.literal('cah'),
            white: z.string().array(),
            black: z.string()
        }),
        z.object({
            type: z.literal('emoji'),
            name: z.string(),
            size: z.number(),
            svg: z.boolean()
        }),
        z.object({
            type: z.literal('color'),
            color: z.string().array().readonly()
        }),
        z.object({
            type: z.literal('shit'),
            text: z.string(),
            plural: z.boolean()
        })
    ]
));
export type ImageRequest = z.infer<typeof ImageRequest>;
export type ImageRequestData<Type extends ImageRequest['type']> = ImageRequest extends infer Payload
    ? Payload extends { type: infer R; }
    ? Type extends R
    ? Payload
    : never
    : never
    : never;

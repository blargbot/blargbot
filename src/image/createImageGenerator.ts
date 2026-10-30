import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import type { ImageRequest, ImageRequestData, ImageResponse } from '@blargbot/contracts';
import { asBuffer, asUint8Array, BufferWriter } from '@blargbot/util';
import GIFEncoder from 'gif-encoder';
import gm from 'gm';

import type { GeneratorContext } from './GeneratorContext.js';
import { art } from './generators/art.js';
import { cah } from './generators/cah.js';
import { caption } from './generators/caption.js';
import { clint } from './generators/clint.js';
import { clippy } from './generators/clippy.js';
import { clyde } from './generators/clyde.js';
import { color } from './generators/color.js';
import { $delete } from './generators/delete.js';
import { distort } from './generators/distort.js';
import { emoji } from './generators/emoji.js';
import { free } from './generators/free.js';
import { linus } from './generators/linus.js';
import { pccheck } from './generators/pccheck.js';
import { pixelate } from './generators/pixelate.js';
import { shit } from './generators/shit.js';
import { sonicsays } from './generators/sonicsays.js';
import { starVsTheForcesOf } from './generators/starVsTheForcesOf.js';
import { stupid } from './generators/stupid.js';
import { thesearch } from './generators/thesearch.js';
import { truth } from './generators/truth.js';

const im = gm.subClass({ imageMagick: true });

export interface ImageGeneratorOptions {
    fetch: typeof fetch;
    resourceDirectory: string;
    apiUri: string;
    apiToken: string;
}

export function createImageGenerator(options: ImageGeneratorOptions): (request: ImageRequest) => Promise<ImageResponse> {
    const imgDir = path.join(options.resourceDirectory, 'img');
    const context: GeneratorContext = Object.freeze<GeneratorContext>({
        fetch: options.fetch,
        getLocal(...segments) {
            const fullPath = path.join(imgDir, ...segments);
            return {
                path: fullPath,
                async bytes() {
                    return asUint8Array(await fs.readFile(fullPath));
                }
            };
        },
        async getRemote(url) {
            url = url.trim();
            if (url.startsWith('<') && url.endsWith('>')) {
                url = url.substring(1, url.length - 1);
            }

            const response = await options.fetch(url);

            switch (response.headers.get('content-type')) {
                case 'image/gif':
                case 'image/png':
                case 'image/jpeg':
                case 'image/bmp':
                    return await response.bytes();
                default:
                    throw new Error('Wrong file type!');
            }
        },
        async renderApi(type, data) {
            const response = await options.fetch(options.apiUri + type, {
                method: 'POST',
                headers: {
                    ['Authorization']: options.apiToken,
                    ['Content-Type']: 'application/json'
                },
                body: JSON.stringify(data)
            });

            const contentType = response.headers.get('content-type')?.split('/');
            if (!response.ok || contentType?.[0] !== 'image' || contentType.length === 0)
                return null;

            const image = await response.bytes();
            if (image.length > 0)
                return { data: image, fileName: `${type}.${contentType[1]}` };
            return null;
        },
        async renderText(text, options) {
            const caption = `caption:${text.replaceAll(/[\\%@]/g, m => `\\${m}`)}`;
            return await this.gmConvert(new Uint8Array(0), x => x
                .out('-size', `${options.width}x${options.height ?? ''}`)
                .font(context.getLocal('fonts', options.font).path, options.fontsize)
                .background('transparent')
                .fill('black')
                .gravity(options.gravity ?? 'Center')
                .stroke(options.outline?.[0] ?? 'none')
                .strokeWidth((options.outline?.[1] ?? 1) * 2)
                .out(caption) // write text with stroke
                .compose('xor')
                .stroke('none')
                .out(caption, '-composite') // remove text and half of the stroke
                .compose('over')
                .fill(options.fill ?? 'black')
                .out(caption, '-composite') // write text again, filling in removed region
            );
        },
        async gmConvert(source, transform, format) {
            const pipeline = im(asBuffer(source)).command('convert');
            const result = transform(pipeline).setFormat(format ?? 'png');
            return asUint8Array(await promisify<Buffer>(cb => result.toBuffer(cb))());
        },
        async renderGif(frames, options) {
            const encoder = new GIFEncoder(options.width, options.height);
            encoder.setDelay(options.delay ?? 50);
            encoder.setQuality(options.quality ?? 10);
            encoder.setRepeat(options.repeat ?? 0);
            const result = new BufferWriter();
            encoder.pipe(result);
            encoder.writeHeader();
            for (const frame of frames)
                encoder.addFrame(frame);
            encoder.finish();
            return asUint8Array(await result.getResult());
        }
    });
    return async (request) => await generators[request.type](request as never, context);
}

const generators = {
    truth,
    clyde,
    clippy,
    delete: $delete,
    pccheck,
    sonicsays,
    thesearch,
    starVsTheForcesOf,
    distort,
    art,
    clint,
    linus,
    stupid,
    pixelate,
    free,
    caption,
    cah,
    emoji,
    color,
    shit
} satisfies { [P in ImageRequest['type']]: (request: ImageRequestData<P>, context: GeneratorContext) => Promise<ImageResponse>; };

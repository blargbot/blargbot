import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { BufferWriter } from '@blargbot/core/BufferWriter.js';
import { resourceDirectory } from '@blargbot/res';
import gifEncoder from 'gif-encoder';
import gm from 'gm';

import type { ImageWorker } from './ImageWorker.js';
import type { ImageGeneratorMap, ImageResult, TextOptions } from './types.js';

const im = gm.subClass({ imageMagick: true });
const imgDir = path.join(resourceDirectory, 'img');
const emptyBuffer = Buffer.from([]);

export abstract class BaseImageGenerator<T extends keyof ImageGeneratorMap> {
    protected get fetch(): typeof fetch { return this.worker.fetch; }

    public constructor(
        public readonly key: T,
        protected readonly worker: ImageWorker
    ) {
        worker.on(key, async ({ data, reply }) => {
            worker.logger.worker(`${key} Requested`);
            try {
                const result = await this.execute(<ImageGeneratorMap[T]>data);
                worker.logger.worker(`${key} finished, submitting as base64. Size: ${result?.data.length ?? 'NaN'}`);
                reply(result === undefined ? null : {
                    data: result.data.toString('base64'),
                    fileName: result.fileName
                });
            } catch (err: unknown) {
                worker.logger.error(`An error occurred while generating ${key}:`, err);
                reply(null);
            }
        });
    }

    public abstract execute(message: ImageGeneratorMap[T]): Promise<ImageResult | undefined>;

    protected getLocalPath(...segments: string[]): string {
        return path.join(imgDir, ...segments);
    }

    protected async getLocal(...segments: string[]): Promise<Buffer> {
        return await fs.readFile(this.getLocalPath(...segments));
    }

    protected async getRemote(url: string): Promise<Buffer> {
        url = url.trim();
        if (url.startsWith('<') && url.endsWith('>')) {
            url = url.substring(1, url.length - 1);
        }

        this.worker.logger.debug(url);
        const response = await this.fetch(url);

        switch (response.headers.get('content-type')) {
            case 'image/gif':
            case 'image/png':
            case 'image/jpeg':
            case 'image/bmp':
                return Buffer.from(await response.arrayBuffer());
            default:
                throw new Error('Wrong file type!');
        }
    }

    protected async gmConvert(source: Buffer, transform: (image: gm.State) => gm.State, format?: string): Promise<Buffer> {
        const pipeline = im(source).command('convert');
        const result = transform(pipeline).setFormat(format ?? 'png');
        return await promisify<Buffer>(cb => result.toBuffer(cb))();
    }

    protected async toGif(frames: Buffer[], options: GifOptions): Promise<Buffer> {
        const encoder = new gifEncoder(options.width, options.height);
        encoder.setDelay(options.delay ?? 50);
        encoder.setQuality(options.quality ?? 10);
        encoder.setRepeat(options.repeat ?? 0);
        const result = new BufferWriter();
        encoder.pipe(result);
        encoder.writeHeader();
        for (const frame of frames)
            encoder.addFrame(frame);
        encoder.finish();
        return await result.getResult();
    }

    protected async renderText(text: string, options: TextOptions): Promise<Buffer> {
        const caption = `caption:${text.replaceAll(/[\\%@]/g, m => `\\${m}`)}`;
        return await this.gmConvert(emptyBuffer, x => x
            .out('-size', `${options.width}x${options.height ?? ''}`)
            .font(this.getLocalPath('fonts', options.font), options.fontsize)
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
    }
}

export interface GifOptions {
    readonly width: number;
    readonly height: number;
    readonly delay?: number;
    readonly quality?: number;
    readonly repeat?: number;
}

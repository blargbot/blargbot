import fs from 'fs/promises';
import GIFEncoder from 'gifencoder';
import gm from 'gm';
import fetch from 'node-fetch';
import path from 'path';
import sharp from 'sharp';
import { Readable } from 'stream';
import { inspect } from 'util';

import { ImageWorker } from './ImageWorker';
import { ImageGeneratorMap, ImageResult, MagickSource, TextOptions } from './types';

const im = gm.subClass({ imageMagick: true });
const imgDir = path.join(path.dirname(require.resolve('@blargbot/res/package')), 'img');

export abstract class BaseImageGenerator<T extends keyof ImageGeneratorMap> {
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

    protected getLocalResourcePath(...segments: string[]): string {
        return path.join(imgDir, ...segments);
    }

    protected async getLocal(...segments: string[]): Promise<Buffer> {
        return await fs.readFile(this.getLocalResourcePath(...segments));
    }

    protected async toBuffer(source: gm.State, format?: string): Promise<Buffer> {
        return await new Promise<Buffer>((resolve, reject) => {
            source.setFormat(format ?? 'png').toBuffer((err, buffer) => {
                if (err !== null) {
                    reject(err);
                    return;
                }
                resolve(buffer);
            });
        });
    }

    protected async getRemote(url: string): Promise<Buffer> {
        url = url.trim();
        if (url.startsWith('<') && url.endsWith('>')) {
            url = url.substring(1, url.length - 1);
        }

        this.worker.logger.debug(url);
        const response = await fetch(url);

        switch (response.headers.get('content-type')) {
            case 'image/gif':
            case 'image/png':
            case 'image/jpeg':
            case 'image/bmp':
                return await response.buffer();
            default:
                throw new Error('Wrong file type!');
        }
    }

    protected async generate(source: MagickSource, configure: (image: gm.State) => (Promise<void> | void), format?: string): Promise<Buffer> {
        if (typeof source === 'string')
            source = im(source);
        else if (Array.isArray(source))
            source = im(...source);
        else if (source instanceof Buffer)
            source = im(source);
        else if (!isGm(source))
            throw new Error(`Unable to read ${inspect(source)} into imagemagick`);

        source.command('convert');
        await configure(source);

        return await this.toBuffer(source, format);
    }

    protected async trim(data: Buffer, color: sharp.Color = 'transparent'): Promise<Buffer> {
        const { width = 0, height = 0, channels = 4 } = await sharp(data).metadata();
        return await sharp(
            await sharp(data)
                .resize(width + 1, height + 1)
                .composite([
                    {
                        input: { create: { width: 1, height: 1, channels, background: color } },
                        tile: true,
                        blend: 'source'
                    },
                    { input: data, left: 1, top: 1 }
                ])
                .toBuffer())
            .trim(1)
            .toBuffer();
    }

    protected async toGif(frames: Buffer[], options: GIFEncoder.GIFOptions & { width: number; height: number; }): Promise<Buffer> {
        return await new Promise<Buffer>((resolve, reject) => {
            const encoder = new GIFEncoder(options.width, options.height);
            const frameStream = Readable.from(frames);
            const buffers: Uint8Array[] = [];
            const sr = frameStream.pipe(encoder.createWriteStream(options));
            sr.on('data', (data: Uint8Array) => buffers.push(data));
            sr.on('error', err => reject(err));
            sr.on('end', () => {
                const buffer = new Uint8Array(buffers.reduce((c, b) => c + b.length, 0));
                buffers.reduce((offset, bytes) => {
                    buffer.set(bytes, offset);
                    return offset + bytes.length;
                }, 0);
                resolve(Buffer.from(buffer));
            });
        });
    }

    protected async renderText(text: string, options: TextOptions): Promise<Buffer> {
        this.worker.logger.debug(`Generating caption for text '${text}'`);

        const { fill = 'black', gravity = 'center', font, fontsize, size, stroke, strokewidth } = options;

        return await this.generate(Buffer.from(''), image => {
            if (font !== undefined)
                image.font(this.getLocalResourcePath('fonts', font), fontsize);

            image.out('-size').out(size);
            image.out('-background').out('transparent');
            image.out('-fill').out(fill);
            image.out('-gravity').out(gravity);
            if (stroke !== undefined) {
                image.out('-stroke').out(stroke);
                if (strokewidth !== undefined)
                    image.out('-strokewidth').out(strokewidth);
            }
            image.out(`caption:${text}`);
            if (stroke !== undefined) {
                image.out('-compose').out('Over');
                image.out('-size').out(size);
                image.out('-background').out('transparent');
                image.out('-fill').out(fill);
                image.out('-gravity').out(gravity);
                image.out('-stroke').out('none');
                image.out(`caption:${text}`);
                image.out('-composite');
            }
            image.setFormat('png');
        });
    }
}

function isGm(source: MagickSource): source is gm.State {
    return source instanceof gm;
}

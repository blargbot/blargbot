import gm from 'gm';
import Jimp from 'jimp';
import fetch from 'node-fetch';
import path from 'path';
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

    protected getLocalJimp(...segments: string[]): Promise<Jimp> {
        return Jimp.read(this.getLocalResourcePath(...segments));
    }

    protected toImageData(source: Jimp): ImageData {
        return new ImageData(
            new Uint8ClampedArray(source.bitmap.data),
            source.bitmap.width,
            source.bitmap.height);
    }

    protected async toBuffer(source: gm.State, format?: string): Promise<Buffer> {
        return await new Promise<Buffer>((resolve, reject) => {
            source.setFormat(format ?? 'png').toBuffer((err, buffer) => {
                if (err !== null) {
                    const oldStack = err.stack;
                    // eslint-disable-next-line @typescript-eslint/unbound-method
                    Error.captureStackTrace(err, this.toBuffer);
                    err.stack = `${oldStack ?? ''}\n${err.stack ?? ''}`;

                    reject(err);
                    return;
                }
                resolve(buffer);
            });
        });
    }

    protected async getRemoteJimp(url: string): Promise<Jimp> {
        return await Jimp.read(await this.getRemote(url));
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
                return await this.toBuffer(
                    gm(response.body, 'temp.gif')
                        .selectFrame(1)
                        .setFormat('png')
                );
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
        else if (isJimp(source))
            source = im(await source.getBufferAsync(Jimp.MIME_PNG));
        else if (source instanceof Buffer)
            source = im(source);
        else if (!isGm(source))
            throw new Error(`Unable to read ${inspect(source)} into imagemagick`);

        source.command('convert');
        await configure(source);

        return await this.toBuffer(source, format);
    }

    protected async generateJimp(source: MagickSource, configure: (image: gm.State) => (Promise<void> | void)): Promise<Jimp> {
        return await Jimp.read(await this.generate(source, configure));
    }

    protected renderJimpText(text: string, options: TextOptions): Promise<Jimp> {
        options.fill ??= 'black';
        options.gravity ??= 'Center';

        this.worker.logger.debug(`Generating caption for text '${text}'`);

        const { fill, gravity, font, fontsize, size, stroke, strokewidth } = options;

        return this.generateJimp(Buffer.from(''), image => {
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

function isJimp(source: MagickSource): source is Jimp {
    return source instanceof Jimp;
}

function isGm(source: MagickSource): source is gm.State {
    return source instanceof gm;
}

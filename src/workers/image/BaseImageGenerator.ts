import gm from 'gm';
import Jimp from 'jimp';
import fetch from 'node-fetch';
import path from 'path';
import phantom from 'phantom';
import { inspect } from 'util';

import { ImageWorker } from './ImageWorker';
import { ImageGeneratorMap, ImageResult, MagickSource, PhantomOptions, PhantomTransformOptions, TextOptions } from './types';

const im = gm.subClass({ imageMagick: true });
const imgDir = path.join(path.dirname(require.resolve('@res/contributors')), 'img');

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

    protected async renderPhantom(file: string, options: PhantomOptions): Promise<Buffer>
    protected async renderPhantom<T>(file: string, options: PhantomTransformOptions<T>): Promise<Buffer>
    protected async renderPhantom(file: string, options: Partial<PhantomTransformOptions<unknown>>): Promise<Buffer> {
        const { replacements, scale = 1, format = 'PNG', transform, transformArg } = options;
        const instance = await phantom.create(['--ignore-ssl-errors=true', '--ssl-protocol=TLSv1']);
        const page = await instance.createPage();

        const dPath = this.getLocalResourcePath(file).replace(/\\/g, '/').replace(/^\w:/, '');
        await page.on('onConsoleMessage', (msg) => this.worker.logger.debug('[IM]', msg));
        await page.on('onResourceError', (resourceError) => this.worker.logger.error(`${resourceError.url}: ${resourceError.errorString}`));
        await page.open(dPath);
        await page.on('viewportSize', { width: 1440, height: 900 });
        await page.on('zoomFactor', scale);

        const rect = await page.evaluate(phantomGetrect, replacements);

        if (rect !== undefined) {
            await page.on('clipRect', {
                top: rect.top,
                left: rect.left,
                width: rect.width * scale,
                height: rect.height * scale
            });
        }

        if (transform !== undefined)
            await page.evaluate(transform, transformArg);

        await page.evaluate(phantomResize);

        const base64 = await page.renderBase64(format);
        instance.exit();
        return Buffer.from(base64);
    }
}

// This method is turned into a string and run on the phantom instance, not in node
function phantomGetrect(replacements: PhantomOptions['replacements']): { top: number; left: number; width: number; height: number; } | undefined {
    if (replacements !== undefined) {
        for (const [key, value] of Object.entries(replacements)) {
            const thing = document.getElementById(key);
            if (thing !== null)
                thing.innerText = value;
        }
    }
    try {
        const workspace = document.getElementById('workspace');
        return workspace?.getBoundingClientRect();
    } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error(err);
        return { top: 0, left: 0, width: 300, height: 300 };
    }
}

function phantomResize(): void {
    let el;
    let i;
    const elements = document.getElementsByClassName('resize');
    const wrapper = document.getElementById('wrapper');
    if (elements.length < 0 || wrapper === null) {
        return;
    }

    const resizeText = function (el: HTMLElement): void {
        const elNewFontSize = `${parseInt(el.style.fontSize.slice(0, -2)) - 1}px`;
        // eslint-disable-next-line no-console
        console.log(elNewFontSize); // console inside the phantom browser, not the blargbot console
        el.style.fontSize = elNewFontSize;
    };

    for (i = 0; i < elements.length; i++) {
        el = elements[i];
        if (el instanceof HTMLElement) {
            if (el.style.fontSize === '')
                el.style.fontSize = '65px';

            let ii = 0;
            while (el.scrollHeight > wrapper.clientHeight) {
                resizeText(el);
                if (++ii === 1000)
                    break;
            }
        }
    }
}

function isJimp(source: MagickSource): source is Jimp {
    return source instanceof Jimp;
}

function isGm(source: MagickSource): source is gm.State {
    return source instanceof gm;
}

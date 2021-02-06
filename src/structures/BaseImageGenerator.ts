import Jimp from 'jimp';
import phantom from 'phantom';
import path from 'path';
import request, { RequiredUriUrl, CoreOptions, Response } from 'request';
import gm from 'gm';
import { JimpGifEncoder } from './JimpGifEncoder';
const im = gm.subClass({
    imageMagick: true
});

type MagickSource = string | Jimp | Buffer | gm.State | null | [width: number, height: number, color?: string];

interface TextOptions {
    font?: string;
    fontsize?: number;
    size?: string;
    fill?: string;
    gravity?: string;
    stroke?: string;
    strokewidth?: string
}

interface PhantomOptions {
    replacements?: { [elementId: string]: string },
    scale?: number;
    format?: string;
}

interface PhantomTransformOptions<T> extends PhantomOptions {
    transform: (arg: T) => any;
    transformArg: T;
}

export abstract class BaseImageGenerator {
    constructor(
        public readonly logger: WorkerLogger
    ) {
    }

    abstract execute(message: JObject): Promise<Buffer | undefined>;

    getLocalResourcePath(...segments: string[]) {
        return path.join(__dirname, '..', '..', 'res', 'img', ...segments);
    }

    getLocalJimp(...segments: string[]) {
        return Jimp.read(this.getLocalResourcePath(...segments));
    }

    toImageData(source: Jimp) {
        return new ImageData(
            new Uint8ClampedArray(source.bitmap.data),
            source.bitmap.width,
            source.bitmap.height);
    }

    toBuffer(source: gm.State, format?: string) {
        return new Promise<Buffer>((resolve, reject) => {
            source.setFormat(format || 'png').toBuffer((err, buffer) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(buffer);
            });
        });
    }

    async getRemoteJimp(url: string) {
        return await Jimp.read(await this.getRemote(url));
    }

    getRemote(url: string) {
        return new Promise<Buffer>(async (fulfill, reject) => {
            url = url.trim();
            if (url.startsWith('<') && url.endsWith('>')) {
                url = url.substring(1, url.length - 1);
            }
            this.logger.debug(url);
            let r = await aRequest({ uri: url });
            if (r.res.headers['content-type'] == 'image/gif') {
                this.toBuffer(gm(r.body, 'temp.gif').selectFrame(1).setFormat('png'))
                    .then(fulfill).catch(reject);
            } else if (r.res.headers['content-type'] == 'image/png' ||
                r.res.headers['content-type'] == 'image/jpeg' ||
                r.res.headers['content-type'] == 'image/bmp') {
                fulfill(r.body);
            } else {
                reject('Wrong file type!');
            }
        });
    }

    async generate(source: MagickSource, configure: (image: gm.State) => (Promise<void> | void)) {
        if (source === null || source === undefined)
            source = im(undefined!);
        else if (typeof source === 'string')
            source = im(source);
        else if (Array.isArray(source))
            source = im(...source);
        else if (isJimp(source))
            source = im(await source.getBufferAsync(Jimp.MIME_PNG));
        else if (source instanceof Buffer)
            source = im(source);
        else if (isGm(source))
            source = source;
        else
            throw new Error(`Unable to read ${source} into imagemagick`);

        source.command('convert');
        await configure(source);

        return await this.toBuffer(source);
    }

    async generateJimp(source: MagickSource, configure: (image: gm.State) => (Promise<void> | void)) {
        return await Jimp.read(await this.generate(source, configure));
    }

    renderJimpText(text: string, options: TextOptions) {
        if (!text)
            throw new Error('No text provided');

        if (!options.fill)
            options.fill = 'black';
        if (!options.gravity)
            options.gravity = 'Center';

        this.logger.debug(`Generating caption for text '${text}'`);

        const { fill, gravity, font, fontsize, size, stroke, strokewidth } = options;

        return this.generateJimp(null, image => {
            if (font !== undefined)
                image.font(this.getLocalResourcePath('fonts', font), fontsize);

            if (size !== undefined)
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
                if (size !== undefined)
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

    async renderPhantom(file: string, options: PhantomOptions): Promise<Buffer>
    async renderPhantom<T>(file: string, options: PhantomTransformOptions<T>): Promise<Buffer>
    async renderPhantom(file: string, options: Partial<PhantomTransformOptions<any>>): Promise<Buffer> {
        const { replacements, scale = 1, format = 'PNG', transform, transformArg } = options;
        const instance = await phantom.create(['--ignore-ssl-errors=true', '--ssl-protocol=TLSv1']);
        const page = await instance.createPage();

        page.on('onConsoleMessage', (msg) => {
            this.logger.debug('[IM]', msg);
        });
        page.on('onResourceError', (resourceError) => {
            this.logger.error(resourceError.url + ': ' + resourceError.errorString);
        });

        let dPath = this.getLocalResourcePath(file).replace(/\\/g, '/').replace(/^\w:/, '');;
        await page.open(dPath);
        await page.on('viewportSize', { width: 1440, height: 900 });
        await page.on('zoomFactor', scale);

        let rect = await page.evaluate(phantom_getrect, replacements);

        if (rect) {
            await page.on('clipRect', {
                top: rect.top,
                left: rect.left,
                width: rect.width * scale,
                height: rect.height * scale
            });
        }

        if (transform)
            await page.evaluate(transform, transformArg);

        await page.evaluate(phantom_resize);

        let base64 = await page.renderBase64(format);
        instance.exit();
        return Buffer.from(base64);
    }
}

function phantom_getrect(replacements: PhantomOptions['replacements']): { top: number, left: number, width: number, height: number } | undefined {
    if (replacements) {
        var keys = Object.keys(replacements);
        for (var i = 0; i < keys.length; i++) {
            var thing = document.getElementById(keys[i]);
            if (thing)
                thing.innerText = replacements[keys[i]];
        }
    }
    try {
        var workspace = document.getElementById("workspace");
        return workspace?.getBoundingClientRect();
    } catch (err) {
        console.error(err); // console inside the phantom browser, not the blargbot console
        return { top: 0, left: 0, width: 300, height: 300 };
    }
}

function phantom_resize() {
    var el, _i, _len, _results;
    const elements = document.getElementsByClassName('resize');
    const wrapper = document.getElementById('wrapper');
    if (elements.length < 0 || wrapper === null) {
        return;
    }
    _results = [];
    for (_i = 0, _len = elements.length; _i < _len; _i++) {
        el = elements[_i];
        if (el instanceof HTMLElement) {
            _results.push((function (el) {
                var resizeText, _results1;
                if (el.style.fontSize === '')
                    el.style.fontSize = '65px';
                resizeText = function () {
                    var elNewFontSize;
                    elNewFontSize = (parseInt(el.style.fontSize.slice(0, -2)) - 1) + 'px';
                    console.log(elNewFontSize); // console inside the phantom browser, not the blargbot console
                    el.style.fontSize = elNewFontSize;
                    return el;
                };
                _results1 = null;
                var ii = 0;
                while (el.scrollHeight > wrapper.clientHeight) {
                    _results1 = resizeText();
                    if (++ii == 1000)
                        break;
                }
                return _results1;
            })(el));
        }
    }
}

function aRequest(obj: RequiredUriUrl & CoreOptions) {
    return new Promise<{ res: Response, body: any }>((resolve, reject) => {
        if (!obj.encoding)
            obj.encoding = null;

        request(obj, (err, res, body) => {
            if (err) {
                reject(err);
                return;
            }
            resolve({
                res: res,
                body: body
            });
        });
    });
}

function isJimp(source: object): source is Pick<Jimp, 'getBufferAsync'> {
    if (!(source instanceof Jimp && 'getBufferAsync' in source))
        return false;

    const tSource = <{ getBufferAsync: unknown }>source;
    return typeof tSource['getBufferAsync'] === 'function';
}

function isGm(source: object): source is Pick<gm.State, 'toBuffer'> {
    if (!(source instanceof gm && 'toBuffer' in source))
        return false;

    const tSource = <{ toBuffer: unknown }>source;
    return typeof tSource['toBuffer'] === 'function';
}
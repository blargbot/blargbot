const Jimp = require('jimp');
const GIFEncoder = require('gifencoder');
const path = require('path');
const request = require('request');
const { createReadStream } = require('fs');
const gm = require('gm');
const im = gm.subClass({
    imageMagick: true
});

class ImageGenerator {
    constructor(logger) {
        this.logger = logger;
        this.MIME_JPEG = Jimp.MIME_JPEG;
        this.MIME_PNG = Jimp.MIME_PNG;
        this.MIME_BMP = Jimp.MIME_BMP;
    }

    /**
     * @param {object} message
     * @returns {Promise<Buffer>}
     */
    async execute(message) {
        throw new Error('Not implemented');
    }

    async read(src) {
        return await Jimp.read(src);
    }

    /**
     * @param {number} width
     * @param {number} height
     * @param {*} callback
     */
    canvas(width, height, callback = undefined) {
        return new Jimp(width, height, callback);
    }

    /**
     * @param {number} width
     * @param {number} height
     */
    gif(width, height, delay, repeat) {
        let encoder = new GIFEncoder(width, height);
        encoder.buffers = [];
        encoder.on('data', buffer => {
            encoder.buffers.push(buffer);
        });
        encoder.start();
        encoder.setDelay(delay);
        encoder.setRepeat(repeat);
        return encoder;
    }

    getLocalResourcePath(...segments) {
        return path.join(__dirname, '..', '..', 'res', 'img', ...segments);
    }

    getLocal(...segments) {
        return Jimp.read(this.getLocalResourcePath(...segments));
    }

    /**
     * @param {Buffer | Jimp | gm.State | GIFEncoder} source
     * @param {string} [format]
     * @returns {Promise<Buffer>}
     */
    toBuffer(source, format) {
        if (source instanceof Buffer)
            return Promise.resolve(source);

        if (source instanceof Jimp)
            return new Promise((fulfill, reject) => {
                source.getBuffer(format || this.MIME_PNG, (err, buffer) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    fulfill(buffer);
                });
            });

        if (source instanceof GIFEncoder)
            return new Promise(async (resolve, reject) => {
                source.on('end', async () => {
                    resolve(Buffer.concat(source.buffers));
                });

                source.finish();
            });

        if (source instanceof gm)
            return new Promise((resolve, reject) => {
                source.setFormat(format || 'png').toBuffer((err, buffer) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(buffer);
                });
            });
    }

    async getRemote(url) {
        return await this.read(await this.getRemoteBuffer(url));
    }

    getRemoteBuffer(url) {
        return new Promise(async (fulfill, reject) => {
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

    /**
     * @param {[number, number, string?] | string | Jimp | Buffer | im.State | null | undefined} source
     * @param {(image: gm.State) => (Promise<void> | void)} configure
     * @returns {Promise<Buffer>}
     */
    async generateBuffer(source, configure) {
        let img;
        if (source === null || source === undefined)
            img = im();
        else if (typeof source === 'string')
            img = im(source);
        else if (Array.isArray(source))
            img = im(...source);
        else if (source instanceof Jimp)
            img = im(await this.toBuffer(source));
        else if (source instanceof Buffer)
            img = im(source);
        else if (source instanceof im.State)
            img = source;
        else
            throw new Error(`Unable to read ${source} into imagemagick`);

        img.command('convert');
        await configure(img);

        return await this.toBuffer(img);
    }
    /**
     * @param {[number, number, string?] | string | Jimp | Buffer | im.State | null | undefined} source
     * @param {(image: gm.State) => (Promise<void> | void)} configure
     * @returns {Promise<Jimp>}
     */
    async generate(source, configure) {
        return await this.read(await this.generateBuffer(source, configure));
    }

    /**
     * @param {string} text
     * @param {object} options
     * @param {string} options.font
     * @param {string} [options.fontsize]
     * @param {number} [options.size]
     * @param {string} [options.fill]
     * @param {string} [options.gravity]
     * @param {string} [options.stroke]
     * @param {number} [options.strokewidth]
     * @returns {Promise<Jimp>}
     */
    renderText(text, { font, fontsize, size, fill, gravity, stroke, strokewidth }) {
        if (!text)
            throw new Error('No text provided');

        if (!fill)
            fill = 'black';
        if (!gravity)
            gravity = 'Center';

        this.logger.debug(`Generating caption for text '${text}'`);

        return this.generate([], image => {
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
}



function aRequest(obj) {
    return new Promise((fulfill, reject) => {
        if (!obj.encoding) obj.encoding = null;
        request(obj, (err, res, body) => {
            if (err) {
                reject(err);
                return;
            }
            fulfill({
                res: res,
                body: body
            });
        });
    });
}

module.exports = { ImageGenerator };
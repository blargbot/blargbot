const Eris = require('eris');
const Random = require('../Helpers/Random');
const random = new Random();
const superagent = require('superagent');
const phantom = require('phantom');

const gm = require('gm');
const im = require('gm').subClass({
    imageMagick: true
});

const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

class ImageGenerator {
    constructor() {
        this.bot = new Eris(process.env.BOT_TOKEN);
        this.message = process.env.IMAGE_MESSAGE || '';
        this.channel = process.env.IMAGE_CHANNEL;
    }

    get request() { return superagent; }
    get random() { return random; }
    get gm() { return gm; }
    get im() { return im; }
    get Jimp() { return Jimp; }
    get fs() { return fs; }
    get path() { return path; }
    get phantom() { return phantom; }

    async generate(args) {
        if (this.channel)
            await this.bot.sendChannelTyping(this.channel);
    }

    async send(name, data) {
        if (typeof data === 'string')
            data = Buffer.from(data, 'base64');
        if (process.env.DESTINATION === 'api') {
            process.send(data.toString('base64'));
        } else {
            let msg = await this.bot.createMessage(this.channel, this.message, {
                file: data,
                name
            });
            process.send(msg.id);
        }
    }

    async renderPhantom(file, replaces, scale = 1, format = 'PNG', extraFunction, extraFunctionArgs) {
        const instance = await phantom.create(['--ignore-ssl-errors=true', '--ssl-protocol=TLSv1']);
        const page = await instance.createPage();

        page.property('onConsoleMessage', function (msg) {
            console.log('[IM]', msg);
        });
        // page.property('onResourceError', function (resourceError) {
        //     console.error(resourceError.url + ': ' + resourceError.errorString);
        // });

        let dPath = this.getLocalResourcePath(file);
        const status = await page.open(dPath);

        await page.property('viewportSize', { width: 1440, height: 900 });
        await page.property('zoomFactor', scale);

        if (typeof extraFunction === 'function') {
            await page.evaluate(extraFunction, extraFunctionArgs);
        }
        let rect = await page.evaluate(function (message) {
            var keys = Object.keys(message);
            for (var i = 0; i < keys.length; i++) {
                var thing = document.getElementById(keys[i]);
                document.querySelector('#' + keys[i]).innerText = message[keys[i]];
            }
            return document.querySelector('#workspace').getBoundingClientRect();
        }, replaces);

        await page.property('clipRect', {
            top: rect.top,
            left: rect.left,
            width: rect.width * scale,
            height: rect.height * scale
        });

        let base64 = await page.renderBase64(format);
        await instance.exit();
        return base64;
    }

    sleep(time = 1000) {
        return new Promise(res => {
            setTimeout(res, time);
        });
    }

    get resourceDir() {
        return this.path.join(__dirname, '..', '..', 'Production', 'Image');
    }

    getLocalResource(name, encoding = null) {
        return new Promise((resolve, reject) => {
            let filePath = this.path.join(this.resourceDir, 'Resources', name);
            fs.readFile(name, { encoding }, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });
    }

    getLocalResourcePath(name) {
        return this.path.join(this.resourceDir, 'Resources', name).replace(/\\/g, '/').replace(/^\w:/, '');
    }

    getResource(url) {
        return new Promise(async function (resolve, reject) {
            url = url.trim();
            if (url.startsWith('<') && url.endsWith('>')) {
                url = url.substring(1, url.length - 1);
            }
            let res = await this.request.get(url);
            if (res.headers['content-type'] == 'image/gif') {
                this.gm(res.body, 'temp.gif').selectFrame(0).setFormat('png').toBuffer(function (err, buffer) {
                    if (err) {
                        console.error('Error converting gif');
                        reject(err);
                        return;
                    }
                    resolve(buffer);
                });
            } else if (['image/png', 'image/jpeg', 'image/bmp'].includes(res.headers['content-type'])) {
                resolve(res.body);
            } else {
                reject('Wrong file type!');
            }
        });
    }

    createCaption(options) {
        return new Promise((resolve, reject) => {
            if (!options.text) {
                reject(new Error('No text provided'));
                return;
            }
            if (!options.font) {
                reject(new Error('No font provided'));
                return;
            }
            if (!options.size) {
                reject(new Error('No size provided'));
                return;
            }
            if (!options.fill) options.fill = 'black';
            if (!options.gravity) options.gravity = 'Center';


            let image = im().command('convert');

            image.font(path.join(__dirname, 'img', 'fonts', options.font));
            image.out('-size').out(options.size);

            image.out('-background').out('transparent');
            image.out('-fill').out(options.fill);
            image.out('-gravity').out(options.gravity);
            if (options.stroke) {
                image.out('-stroke').out(options.stroke);
                if (options.strokewidth) image.out('-strokewidth').out(options.strokewidth);
            }
            image.out(`caption:${options.text}`);
            if (options.stroke) {
                image.out('-compose').out('Over');
                image.out('-size').out(options.size);
                image.out('-background').out('transparent');
                image.out('-fill').out(options.fill);
                image.out('-gravity').out(options.gravity);
                image.out('-stroke').out('none');
                image.out(`caption:${options.text}`);
                image.out('-composite');
            }
            image.setFormat('png');
            image.toBuffer(function (err, buf) {
                if (err) {
                    console.error(`[IM] Failed to generate a caption: '${options.text}'`);
                    reject(err);
                    return;
                }
                resolve(buf);
            });
        });
    }

    getBufferFromIM(img) {
        return new Promise((resolve, reject) => {
            img.setFormat('png').toBuffer(function (err, buffer) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(buffer);
            });
        });
    }

    getBufferFromJimp(img) {
        return new Promise((resolve, reject) => {
            img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(buffer);
            });
        });
    }
}

module.exports = ImageGenerator;
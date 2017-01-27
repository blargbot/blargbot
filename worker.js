process.execArgv[0] = process.execArgv[0].replace('-brk', '');

const cluster = require('cluster');
const gm = require('gm');
const im = require('gm').subClass({
    imageMagick: true
});
const Jimp = require('jimp');
const path = require('path');
const GIFEncoder = require('gifencoder');
const util = require('util');
const request = require('request');
const fs = require('fs');
const Canvas = require('canvas'),
    Image = Canvas.Image;

const logger = {
    cluster: function(msg) {
        process.send({
            cmd: 'log',
            level: 'cluster',
            msg
        })
    },
    debug: function(msg) {
        process.send({
            cmd: 'log',
            level: 'debug',
            msg
        })
    },
    warn: function(msg) {
        process.send({
            cmd: 'log',
            level: 'warn',
            msg
        })
    },
    error: function(msg) {
        process.send({
            cmd: 'log',
            level: 'error',
            msg
        })
    },
    worker: function(msg) {
        process.send({
            cmd: 'log',
            level: 'worker',
            msg
        })
    }
};

const functions = {
    free: async function(msg) {
        let topCaption = await Jimp.read(await createCaption({
            text: msg.top,
            font: 'impact.ttf',
            fill: 'white',
            stroke: 'black',
            strokewidth: 5,
            gravity: 'north',
            size: '380x100'
        }));
        let bottomText = msg.bottom || 'CLICK HERE TO\nFIND OUT HOW';
        let bottomCaption = await Jimp.read(await createCaption({
            text: bottomText,
            font: 'arial.ttf',
            fill: 'white',
            gravity: 'center',
            size: '380x70'
        }));

        let back1 = await Jimp.read(path.join(__dirname, 'img', 'freefreefree0.png'));
        let back2 = await Jimp.read(path.join(__dirname, 'img', 'freefreefree1.png'));

        let frameCount = 6;
        let frames = [];

        let buffers = [];
        let encoder = new GIFEncoder(400, 300);
        let stream = encoder.createReadStream();

        stream.on('data', function(buffer) {
            buffers.push(buffer);
        });
        stream.on('end', function() {
            submitBuffer(msg.code, Buffer.concat(buffers));
        });

        let base = new Jimp(400, 300);

        for (let i = 0; i < frameCount; i++) {
            let temp = base.clone();
            temp.composite(i < frameCount / 2 ? back1 : back2, 0, 0);
            temp.composite(topCaption, i == 0 ? 10 : getRandomInt(-25, 25), i == 0 ? 15 : getRandomInt(0, 20));
            temp.composite(bottomCaption, 10, 228);
            frames.push(temp.bitmap.data);
        }

        encoder.start();
        encoder.setRepeat(0);
        encoder.setDelay(50);
        for (let frame of frames) encoder.addFrame(frame);
        encoder.finish();
    },
    caption: async function(msg) {
        let img = await Jimp.read(await getResource(msg.url));
        let height = img.bitmap.height;
        let width = img.bitmap.width;
        let topbuf;
        let botbuf;
        let input = msg.input;
        let font = msg.font;
        if (input.t) {
            topbuf = await createCaption({
                text: input.t.join(' '),
                font,
                size: `${width}x${height / 6}`,
                gravity: 'north',
                fill: 'white',
                stroke: 'black',
                strokewidth: 4
            });
            let topcap = await Jimp.read(topbuf);
            img.composite(topcap, 0, 0);
        }
        if (input.b) {
            botbuf = await createCaption({
                text: input.b.join(' '),
                font,
                size: `${width}x${height / 6}`,
                gravity: 'south',
                fill: 'white',
                stroke: 'black',
                strokewidth: 4
            });
            let botcap = await Jimp.read(botbuf);
            img.composite(botcap, 0, height / 6 * 5);
        }
        img.scaleToFit(800, 800);

        img.getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    cah: async function(msg) {
        let blackCard = await Jimp.read(path.join(__dirname, 'img', 'blackcard.png'));
        let whiteCard = await Jimp.read(path.join(__dirname, 'img', 'whitecard.png'));

        let finalImg = new Jimp(183 * (msg.white.length + 1), 254);
        let blackCaption = await Jimp.read(await createCaption({
            font: 'arial.ttf',
            fill: '#ffffff',
            text: msg.black,
            size: '144x190',
            gravity: 'northwest'
        }));
        finalImg.composite(blackCard, 0, 0);
        finalImg.composite(blackCaption, 19, 19);

        for (let i = 0; i < msg.white.length; i++) {
            let whiteCaption = await Jimp.read(await createCaption({
                font: 'arial.ttf',
                fill: 'black',
                text: msg.white[i],
                size: '144x190',
                gravity: 'northwest'
            }));
            finalImg.composite(whiteCard, 183 * (i + 1), 0);
            finalImg.composite(whiteCaption, 183 * (i + 1) + 19, 19);
        }

        finalImg.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    retarded: async function(msg) {
        let buf = await createCaption({
            font: 'ARCENA.ttf',
            fill: 'black',
            stroke: 'white',
            strokewidth: 5,
            text: msg.text,
            size: '272x60'
        });

        let text = await Jimp.read(buf);
        let img = await Jimp.read(path.join(__dirname, 'img', `retarded.png`));
        if (msg.avatar) {
            let avatar = await Jimp.read(await getResource(msg.avatar));
            let smallAvatar = avatar.clone();
            smallAvatar.resize(74, 74);
            img.composite(smallAvatar, 166, 131);
            avatar.resize(171, 171);
            avatar.rotate(18);
            img.composite(avatar, 277, 32);
        }
        img.composite(text, 268, 0);
        img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    shit: async function(msg) {
        let buf = await createCaption({
            text: msg.text,
            font: 'animeace.ttf',
            size: '200x160',
            gravity: 'South'
        });

        let text = await Jimp.read(buf);
        let img = await Jimp.read(path.join(__dirname, 'img', `SHIT${msg.plural ? 'S' : ''}.png`));
        img.composite(text, 810, 31);

        img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    art: async function(msg) {
        let avatar = await Jimp.read(await getResource(msg.avatar));
        avatar.resize(370, 370);
        let foreground = await Jimp.read(path.join(__dirname, 'img', `art.png`));
        let img = new Jimp(1364, 1534);
        img.composite(avatar, 903, 92);
        img.composite(avatar, 903, 860);
        img.composite(foreground, 0, 0);

        img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    clint: async function(msg) {
        let avatar = await Jimp.read(await getResource(msg.avatar));
        avatar.resize(700, 700);
        let bgImg = im(await getBufferFromJimp(avatar));
        bgImg.command('convert');
        bgImg.out('-matte').out('-virtual-pixel').out('transparent');
        bgImg.out('-distort');
        bgImg.out('Perspective');
        bgImg.out("0,0,0,132  700,0,330,0  0,700,0,530  700,700,330,700");
        let jBgImg = await Jimp.read(await getBufferFromIM(bgImg));
        let foreground = await Jimp.read(path.join(__dirname, 'img', `clint.png`));
        let img = new Jimp(1200, 675);
        img.composite(jBgImg, 782, 0);

        img.composite(foreground, 0, 0);

        img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    pixelate: async function(msg) {
        let image = await Jimp.read(await getResource(msg.url));
        let img;
        let scale = msg.scale;
        if (image.bitmap.width >= image.bitmap.height) {
            image.resize(scale, Jimp.AUTO);
            image.resize(256, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR);
        } else {
            image.resize(Jimp.AUTO, scale);
            image.resize(Jimp.AUTO, 256, Jimp.RESIZE_NEAREST_NEIGHBOR);
        }

        image.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    triggered: async function(msg) {
        let frameCount = 8;
        let frames = [];
        let avatar = await Jimp.read(await getResource(msg.avatar));
        avatar.resize(320, 320);
        if (msg.inverted) avatar.invert();
        if (msg.horizontal) avatar.flip(true, false);
        if (msg.vertical) avatar.flip(false, true);
        if (msg.sepia) avatar.sepia();
        if (msg.blur) avatar.blur(10);
        if (msg.greyscale) avatar.greyscale();

        let triggered = await Jimp.read(path.join(__dirname, 'img', `triggered.png`))
        triggered.resize(280, 60);
        triggered.opacity(0.8);
        let overlay = await Jimp.read(path.join(__dirname, 'img', `red.png`));

        let buffers = [];
        let encoder = new GIFEncoder(256, 256);
        let stream = encoder.createReadStream();

        stream.on('data', function(buffer) {
            buffers.push(buffer);
        });
        stream.on('end', function() {
            let buffer = Buffer.concat(buffers);
            submitBuffer(msg.code, buffer);
        });

        let base = new Jimp(256, 256);

        let temp, x, y;
        for (let i = 0; i < frameCount; i++) {
            temp = base.clone();
            if (i == 0) {
                x = -16;
                y = -16;
            } else {
                x = -32 + (getRandomInt(-16, 16));
                y = -32 + (getRandomInt(-16, 16));
            }
            temp.composite(avatar, x, y);
            if (i == 0) {
                x = -10;
                y = 200;
            } else {
                x = -12 + (getRandomInt(-8, 8));
                y = 200 + (getRandomInt(-0, 12));
            }
            temp.composite(overlay, 0, 0);
            temp.composite(triggered, x, y);
            frames.push(temp.bitmap.data);
        }
        encoder.start();
        encoder.setRepeat(0);
        encoder.setDelay(20);
        for (let frame of frames) encoder.addFrame(frame);
        encoder.finish();
    },
    thesearch: async function(msg) {
        let buf = await createCaption({
            text: msg.text,
            fill: '#393b3e',
            font: 'SFToontime.ttf',
            size: '160x68'
        });

        let text = await Jimp.read(buf);
        let img = await Jimp.read(path.join(__dirname, 'img', `thesearch.png`));
        img.composite(text, 60, 331);

        img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    objection: async function(msg) {
        let frameCount = 6;
        let frames = [];

        let buffers = [];
        let encoder = new GIFEncoder(767, 572);
        let stream = encoder.createReadStream();
        let objectStream = fs.createReadStream(path.join(__dirname, 'img', 'objection.gif'));
        let writeStream = encoder.createWriteStream();
        stream.on('data', function(buffer) {
            buffers.push(buffer);
        });
        stream.on('end', function() {
            submitBuffer(msg.code, Buffer.concat(buffers));
        });
        objectStream.pipe(writeStream);
        objectStream.on('end', async function() {
            encoder.firstFrame = false;
            let output = '';
            let i = 0;
            for (let char of msg.message) {
                if (i <= 200) {
                    output += char;
                    logger.debug(i, output);
                    let img = im(767, 572, '#ffffff').command('convert');
                    img.font(path.join(__dirname, 'img', 'fonts', 'Ace-Attorney.ttf'), 24);
                    img.out('-fill').out('#000000');
                    img.out('-gravity').out('northwest');
                    img.out('-geometry').out('+50+50');
                    img.out(`caption:${output}`);
                    frames.push(await getBufferFromIM(img));
                    i++;
                }
            }
            encoder.start();
            encoder.setRepeat(-1);
            encoder.setDelay(30);
            for (let frame of frames) {
                let temp = await Jimp.read(frame);
                encoder.addFrame(temp.bitmap.data);
            }
            encoder.finish();
        });
    }
};

process.on('message', async function(msg, handle) {
    switch (msg.cmd) {
        case 'img':
            let command = msg.command;
            try {
                if (functions[command])
                    await functions[command](msg);
            } catch (err) {
                logger.error(err.stack);
            }
            break;
        default:
            logger.worker(`Worker ${cluster.worker.id} got a message!\n${util.inspect(msg)}`);
    }
});

async function submitBuffer(code, buffer) {
    logger.worker('Finished, submitting as base64');
    process.send({
        cmd: 'img',
        code: code,
        buffer: buffer.toString('base64')
    });
}

function getBufferFromIM(img) {
    return new Promise((fulfill, reject) => {
        img.setFormat('png').toBuffer(function(err, buffer) {
            if (err) {
                reject(err);
                return;
            }
            fulfill(buffer);
        });
    });
}

function getBufferFromJimp(img) {
    return new Promise((fulfill, reject) => {
        img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            if (err) {
                reject(err);
                return;
            }
            fulfill(buffer)
        });
    })
}


function createCaption(options) {
    return new Promise((fulfill, reject) => {
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
        logger.debug(`Generating caption for text '${options.text}'`);

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
            image.out('-compose').out('Over')
            image.out('-size').out(options.size);
            image.out('-background').out('transparent');
            image.out('-fill').out(options.fill);
            image.out('-gravity').out(options.gravity);
            image.out('-stroke').out('none');
            image.out(`caption:${options.text}`);
            image.out('-composite');
        }
        image.setFormat('png');
        image.toBuffer(function(err, buf) {
            if (err) {
                logger.error(`Failed to generate a caption: '${options.text}'`);
                reject(err);
                return;
            }
            logger.debug(`Caption generated: '${options.text}'`);
            fulfill(buf);
        });
    });
}


function padRight(value, length) {
    return (value.toString().length < length) ? padRight(value + ' ', length) : value;
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

function getResource(url) {
    return new Promise(async function(fulfill, reject) {
        let r = await aRequest({
            uri: url
        });
        if (r.res.headers['content-type'] == 'image/gif') {
            gm(r.body, 'temp.gif').selectFrame(0).setFormat('png').toBuffer(function(err, buffer) {
                if (err) {
                    logger.error('Error converting gif');
                    reject(err);
                    return;
                }
                fulfill(buffer);
            });
        } else if (r.res.headers['content-type'] == 'image/png' ||
            r.res.headers['content-type'] == 'image/jpeg' ||
            r.res.headers['content-type'] == 'image/bmp') {
            fulfill(r.body);
        } else {
            reject('Wrong file type!');
        }
    });
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
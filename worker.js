process.execArgv[0] = process.execArgv[0].replace('-brk', '');

const cluster = require('cluster');
const gm = require('gm');
const Jimp = require('jimp');
const path = require('path');
const GIFEncoder = require('gifencoder');
const util = require('util');

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

process.on('message', async function(msg, handle) {
    switch (msg.cmd) {
        case 'img':
            let command = msg.command;
            try {
                switch (command) {
                    case 'shit':
                        await imgShit(msg);
                        break;
                    case 'retarded':
                        await imgRetarded(msg);
                        break;
                    case 'triggered':
                        await imgTriggered(msg);
                        break;
                    case 'art':
                        await imgArt(msg);
                        break;
                    case 'free':
                        await imgFree(msg);
                        break;
                    case 'caption':
                        await imgCaption(msg);
                        break;
                    case 'cah':
                        await imgCah(msg);
                        break;
                }
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
    })
}

async function imgFree(msg) {
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
}

async function imgCaption(msg) {
    let img = await Jimp.read(msg.url);
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
        })
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
        })
        let botcap = await Jimp.read(botbuf);
        img.composite(botcap, 0, height / 6 * 5);
    }
    img.scaleToFit(800, 800);

    img.getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
        submitBuffer(msg.code, buffer);
    })
}

async function imgCah(msg) {
    let blackCard = await Jimp.read(path.join(__dirname, 'img', 'blackcard.png'))
    let whiteCard = await Jimp.read(path.join(__dirname, 'img', 'whitecard.png'))

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
    })
}

async function imgRetarded(msg) {
    let buf = await bu.createCaption({
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
        let avatar = await Jimp.read(msg.avatar);
        let smallAvatar = avatar.clone();
        smallAvatar.resize(74, 74);
        img.composite(smallAvatar, 166, 131);
        avatar.resize(171, 171);
        avatar.rotate(18)
        img.composite(avatar, 277, 32);
    }
    img.composite(text, 268, 0);
    img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
        submitBuffer(msg.code, buffer);
    })
}

async function imgShit(msg) {
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
    })
}

async function imgArt(msg) {
    let avatar = await Jimp.read(msg.avatar);
    avatar.resize(370, 370);
    let foreground = await Jimp.read(path.join(__dirname, 'img', `art.png`));
    let img = new Jimp(1364, 1534);
    img.composite(avatar, 903, 92);
    img.composite(avatar, 903, 860);
    img.composite(foreground, 0, 0);

    img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
        submitBuffer(msg.code, buffer);
    })
}

async function imgTriggered(msg) {
    let frameCount = 4;
    let frames = [];
    let avatar = await Jimp.read(msg.avatar);
    avatar.resize(320, 320);
    let triggered = await Jimp.read(path.join(__dirname, 'img', `triggered.png`))
    triggered.resize(200, 30);
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

    let temp = base.clone();
    let x = -29;
    let y = -37;
    temp.composite(avatar, x, y);
    x = 28;
    y = 214;
    temp.composite(overlay, 0, 0);
    temp.composite(triggered, x, y);
    frames.push(temp.bitmap.data);

    temp = base.clone();
    x = -25;
    y = -25;
    temp.composite(avatar, x, y);
    x = 28;
    y = 213;
    temp.composite(overlay, 0, 0);
    temp.composite(triggered, x, y);
    frames.push(temp.bitmap.data);

    temp = base.clone();
    x = -40;
    y = -24;
    temp.composite(avatar, x, y);
    x = 28;
    y = 207;
    temp.composite(overlay, 0, 0);
    temp.composite(triggered, x, y);
    frames.push(temp.bitmap.data);

    temp = base.clone();
    x = -24;
    y = -44;
    temp.composite(avatar, x, y);
    x = 27;
    y = 209;
    temp.composite(overlay, 0, 0);
    temp.composite(triggered, x, y);
    frames.push(temp.bitmap.data);

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(20);
    for (let frame of frames) encoder.addFrame(frame);
    encoder.finish();
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
        logger.debug(`Generating caption for text '${options.text}'`)

        let image = gm().command('convert');

        image.font(path.join(__dirname, 'img', 'fonts', options.font));
        image.out('-size').out(options.size);
        image.out('-background').out('transparent');
        image.out('-fill').out(options.fill);
        image.out('-gravity').out(options.gravity);
        image.out()
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

        image.options({
            imageMagick: true
        }).toBuffer('PNG', function(err, buf) {
            if (err) {
                reject(err);
                return;
            }
            fulfill(buf);
        })
    })
}


function padRight(value, length) {
    return (value.toString().length < length) ? padRight(value + ' ', length) : value;
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
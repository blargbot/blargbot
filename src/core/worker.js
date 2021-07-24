/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:38:19
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-04-26 20:09:03
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */
if (process.execArgv[0])
    process.execArgv[0] = process.execArgv[0].replace('-brk', '');

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Promise Rejection: ' + reason.stack);
});

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
const phantom = require('phantom');

const colorThief = require('color-thief-jimp');

const console = {
    cluster: function (msg) {
        process.send({
            cmd: 'log',
            level: 'cluster',
            msg
        });
    },
    debug: function (msg) {
        process.send({
            cmd: 'log',
            level: 'debug',
            msg
        });
    },
    warn: function (msg) {
        process.send({
            cmd: 'log',
            level: 'warn',
            msg
        });
    },
    error: function (msg) {
        process.send({
            cmd: 'log',
            level: 'error',
            msg
        });
    },
    worker: function (msg) {
        process.send({
            cmd: 'log',
            level: 'worker',
            msg
        });
    }
};

const functions = {
    color: async function (msg) {
        let img = new Jimp(128, 128, msg.hex);
        img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    free: async function (msg) {
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

        let back1 = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', 'freefreefree0.png'));
        let back2 = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', 'freefreefree1.png'));

        let frameCount = 6;
        let frames = [];

        let buffers = [];
        let encoder = new GIFEncoder(400, 300);
        let stream = encoder.createReadStream();

        stream.on('data', function (buffer) {
            buffers.push(buffer);
        });
        stream.on('end', function () {
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
    caption: async function (msg) {
        let img = await Jimp.read(await getResource(msg.url));
        img.scaleToFit(800, 800);

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
                strokewidth: 16
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
                strokewidth: 16
            });
            let botcap = await Jimp.read(botbuf);
            img.composite(botcap, 0, height / 6 * 5);
        }

        img.getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    cah: async function (msg) {
        let blackCard = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', 'blackcard.png'));
        let whiteCard = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', 'whitecard.png'));

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
    retarded: async function (msg) {
        let buf = await createCaption({
            font: 'ARCENA.ttf',
            fill: 'black',
            stroke: 'white',
            strokewidth: 5,
            text: msg.text,
            size: '272x60'
        });

        let text = await Jimp.read(buf);
        let img = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', `retarded.png`));
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
    clippy: async function (msg) {
        let buf = await createCaption({
            text: msg.text,
            font: 'arial.ttf',
            size: '290x130',
            gravity: 'North'
        });
        let text = await Jimp.read(buf);
        let img = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', `clippy.png`));
        img.composite(text, 28, 36);

        img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    truth: async function (msg) {
        let buf = await createCaption({
            text: msg.text,
            font: 'AnnieUseYourTelescope.ttf',
            size: '96x114',
            gravity: 'North'
        });
        let text = await Jimp.read(buf);
        let img = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', `truth.png`));
        img.composite(text, 95, 289);

        img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    shit: async function (msg) {
        let buf = await createCaption({
            text: msg.text,
            font: 'animeace.ttf',
            size: '200x160',
            gravity: 'South'
        });

        let text = await Jimp.read(buf);
        let img = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', `SHIT${msg.plural ? 'S' : ''}.png`));
        img.composite(text, 810, 31);

        img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    art: async function (msg) {
        let avatar = await Jimp.read(await getResource(msg.avatar));
        avatar.resize(370, 370);
        let foreground = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', `art.png`));
        let img = new Jimp(1364, 1534);
        img.composite(avatar, 903, 92);
        img.composite(avatar, 903, 860);
        img.composite(foreground, 0, 0);

        img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    clint: async function (msg) {
        let avatar = await Jimp.read(await getResource(msg.avatar));
        avatar.resize(700, 700);
        let bgImg = im(await getBufferFromJimp(avatar));
        bgImg.command('convert');
        bgImg.out('-matte').out('-virtual-pixel').out('transparent');
        bgImg.out('-distort');
        bgImg.out('Perspective');
        bgImg.out("0,0,0,132  700,0,330,0  0,700,0,530  700,700,330,700");
        let jBgImg = await Jimp.read(await getBufferFromIM(bgImg));
        let foreground = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', `clint.png`));
        let img = new Jimp(1200, 675);
        img.composite(jBgImg, 782, 0);

        img.composite(foreground, 0, 0);

        img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    pixelate: async function (msg) {
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
    triggered: async function (msg) {
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

        let triggered = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', `triggered.png`));
        triggered.resize(280, 60);
        triggered.opacity(0.8);
        let overlay = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', `red.png`));

        let buffers = [];
        let encoder = new GIFEncoder(256, 256);
        let stream = encoder.createReadStream();

        stream.on('data', function (buffer) {
            buffers.push(buffer);
        });
        stream.on('end', function () {
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
    thesearch: async function (msg) {
        let buf = await createCaption({
            text: msg.text,
            fill: '#393b3e',
            font: 'SFToontime.ttf',
            size: '160x68'
        });

        let text = await Jimp.read(buf);
        let img = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', `thesearch.png`));
        img.composite(text, 60, 331);

        img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    clyde: async function (msg) {
        let img = im(864 - 150, 1000).command('convert');
        img.font(path.join(__dirname, '..', '..', 'res', 'img', 'fonts', 'whitney.ttf'), 20);
        img.out('-fill').out('#ffffff');
        img.out('-background').out('transparent');
        img.out('-gravity').out('west');
        img.out(`caption:${msg.text}`);
        let originalText = await Jimp.read(await getBufferFromIM(img));
        let date = new Date();
        let text = new Jimp(originalText.bitmap.width + 10, originalText.bitmap.height + 10);
        text.composite(originalText, 5, 5).autocrop().opacity(0.7);
        let height = 165 + text.bitmap.height;
        let canvas = new Jimp(864, height, 0x33363bff);
        let top = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', `clydeTop.png`));
        let bottom = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', `clydeBottom.png`));
        canvas.composite(top, 0, 0);
        canvas.composite(text, 118, 83);
        canvas.composite(bottom, 0, height - bottom.bitmap.height);

        canvas.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    objection: async function (msg) {
        let frameCount = 6;
        let frames = [];

        let buffers = [];
        let encoder = new GIFEncoder(767, 572);
        let stream = encoder.createReadStream();
        let objectStream = fs.createReadStream(path.join(__dirname, '..', '..', 'res', 'img', 'objection.gif'));
        let writeStream = encoder.createWriteStream();
        stream.on('data', function (buffer) {
            buffers.push(buffer);
        });
        stream.on('end', function () {
            submitBuffer(msg.code, Buffer.concat(buffers));
        });
        objectStream.pipe(writeStream);
        objectStream.on('end', async function () {
            encoder.firstFrame = false;
            let output = '';
            let i = 0;
            for (let char of msg.message) {
                if (i <= 200) {
                    output += char;
                    console.debug(i, output);
                    let img = im(767, 572, '#ffffff').command('convert');
                    img.font(path.join(__dirname, '..', '..', 'res', 'img', 'fonts', 'Ace-Attorney.ttf'), 24);
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
    },
    delete: async function (msg) {
        let buf = await createCaption({
            text: msg.input,
            font: 'whitneybold.ttf',
            size: '512x24',
            gravity: 'South',
            fill: '#f8f8f8'
        });

        let originalText = await Jimp.read(buf);
        let text = new Jimp(originalText.bitmap.width, originalText.bitmap.height + 8);
        text.composite(originalText, 0, 4);
        text.autocrop();
        let iterations = Math.ceil(text.bitmap.width / 64);
        console.debug(text.bitmap.width);
        let delete1 = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', 'delete1.png'));
        let delete2 = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', 'delete2.png'));
        let delete3 = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', 'delete3.png'));
        let cursor = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', 'cursor.png'));
        let width = 128 + (iterations * 64);
        let workspace = new Jimp(width, 84);
        workspace.composite(delete1, 0, 0);
        workspace.composite(delete3, width - 64, 0);
        for (let i = 0; i < iterations; i++) {
            workspace.composite(delete2, (i + 1) * 64, 0);
        }
        workspace.composite(text, 64 + ((iterations * 64 - text.bitmap.width + 32) / 2), 14 + ((48 - text.bitmap.height) / 2));
        workspace.composite(cursor, 64 + ((iterations * 64 - cursor.bitmap.width + 32) / 2), 48);
        //let img = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', `SHIT${msg.plural ? 'S' : ''}.png`));
        //img.composite(text, 810, 31);

        workspace.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    starvstheforcesof: async function (msg) {
        let avatar = await Jimp.read(await getResource(msg.avatar));
        avatar.resize(700, 700);
        let color = colorThief.getColor(avatar);
        //color = color.map(a => a / 2);
        let lowest = Math.min(color[0], color[1], color[2]);
        color = color.map(a => Math.min(a - lowest, 32));
        console.debug(color);
        let bgImg = im(await getBufferFromJimp(avatar));
        bgImg.command('convert');
        bgImg.out('-matte').out('-virtual-pixel').out('transparent');
        bgImg.out('-extent');
        bgImg.out('1468x1656');
        bgImg.out('-distort');
        bgImg.out('Perspective');
        bgImg.out("0,0,0,208  700,0,1468,0  0,700,0,1326  700,700,1468,1656");
        let jBgImg = await Jimp.read(await getBufferFromIM(bgImg));
        jBgImg.resize(734, 828);

        let foreground = await Jimp.read(path.join(__dirname, '..', '..', 'res', 'img', `starvstheforcesof.png`));
        foreground.resize(960, 540);
        let actions = [];
        if (color[0] > 0) actions.push({ apply: 'red', params: [color[0]] });
        if (color[1] > 0) actions.push({ apply: 'green', params: [color[1]] });
        if (color[2] > 0) actions.push({ apply: 'blue', params: [color[2]] });
        foreground.color(actions);
        let img = new Jimp(960, 540);
        jBgImg.crop(0, 104, 600, 540);
        img.composite(jBgImg, 430, 0);
        img.composite(foreground, 0, 0);

        img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            submitBuffer(msg.code, buffer);
        });
    },
    distort: async function (msg) {
        // 344x410
        // 28 - 70
        // 400x620
        let avatar = await Jimp.read(await getResource(msg.avatar));
        const filters = [
            { apply: getRandomInt(0, 1) == 1 ? 'desaturate' : 'saturate', params: [getRandomInt(40, 80)] },
            { apply: 'spin', params: [getRandomInt(10, 350)] }
        ];
        avatar.color(filters);
        let bgImg = im(await getBufferFromJimp(avatar));
        let horizRoll = getRandomInt(0, avatar.bitmap.width),
            vertiRoll = getRandomInt(0, avatar.bitmap.height);
        bgImg.out('-implode').out(`-${getRandomInt(3, 10)}`);
        bgImg.out('-roll').out(`+${horizRoll}+${vertiRoll}`);
        bgImg.out('-swirl').out(`${getRandomInt(0, 1) == 1 ? '+' : '-'}${getRandomInt(120, 180)}`);

        let buffer = await getBufferFromIM(bgImg);

        submitBuffer(msg.code, buffer);
    },
    sonicsays: async function (msg) {
        let res = await renderPhantom('sonicsays.html', { replace1: msg.text }, 2, undefined, [], undefined);
        submitBuffer(msg.code, res);
    },
    pccheck: async function (msg) {
        let container = [];
        let italic = false;
        let temp = '';
        let m = msg.text;
        for (var i = 0; i < m.length; i++) {
            if (m[i] === '*') {
                container.push({ italic, text: temp });
                temp = '';
                italic = !italic;
            } else
                temp += m[i];
        }
        container.push({ italic, text: temp });

        let res = await renderPhantom('pccheck.html', {}, 2, undefined, [function (m) {
            var thing = document.getElementById('replace1');
            for (var i = 0; i < m.length; i++) {
                var el = document.createElement(m[i].italic ? 'em' : 'span');
                el.innerText = m[i].text;
                thing.appendChild(el);
            }
        }, resize], container);
        submitBuffer(msg.code, res);
    }
};

function resize() {
    var el, elements, _i, _len, _results;
    elements = document.getElementsByClassName('resize');
    wrapper = document.getElementById('wrapper');
    if (elements.length < 0) {
        return;
    }
    _results = [];
    for (_i = 0, _len = elements.length; _i < _len; _i++) {
        el = elements[_i];
        _results.push((function (el) {
            var resizeText, _results1;
            if (el.style['font-size'] === '') el.style['font-size'] = '65px';
            resizeText = function () {
                var elNewFontSize;
                elNewFontSize = (parseInt(el.style.fontSize.slice(0, -2)) - 1) + 'px';
                console.log(elNewFontSize);
                el.style.fontSize = elNewFontSize;
                return el;
            };
            _results1 = null;
            var ii = 0;
            while (el.scrollHeight > wrapper.clientHeight) {
                _results1 = resizeText();
                if (++ii == 1000) break;
            }
            return _results1;
        })(el));
    }
}

process.on('message', async function (msg, handle) {
    switch (msg.cmd) {
        case 'img':
            let command = msg.command;
            try {
                if (functions[command])
                    await functions[command](msg);
            } catch (err) {
                console.error(err.stack);
                process.send({
                    cmd: 'img',
                    code: msg.code,
                    buffer: ''
                });
            }
            break;
        default:
            break;
        // console.worker(`Worker ${cluster.worker.id} got a message!\n${util.inspect(msg)}`);
    }
});

async function renderPhantom(file, replaces, scale = 1, format = 'PNG', extraFunctions, extraFunctionArgs) {
    const instance = await phantom.create(['--ignore-ssl-errors=true', '--ssl-protocol=TLSv1']);
    const page = await instance.createPage();

    page.on('onConsoleMessage', function (msg) {
        console.debug('[IM]', msg);
    });
    page.on('onResourceError', function (resourceError) {
        console.error(resourceError.url + ': ' + resourceError.errorString);
    });

    let dPath = path.join(__dirname, '..', '..', 'res', 'img', file).replace(/\\/g, '/').replace(/^\w:/, '');;
    const status = await page.open(dPath);

    await page.on('viewportSize', { width: 1440, height: 900 });
    await page.on('zoomFactor', scale);



    let rect = await page.evaluate(function (message) {
        var keys = Object.keys(message);
        for (var i = 0; i < keys.length; i++) {
            var thing = document.getElementById(keys[i]);
            thing.innerText = message[keys[i]];
        }
        try {
            var workspace = document.getElementById("workspace");
            return workspace.getBoundingClientRect();
        } catch (err) {
            console.error(err);
            return { top: 0, left: 0, width: 300, height: 300 };
        }
    }, replaces);

    await page.on('clipRect', {
        top: rect.top,
        left: rect.left,
        width: rect.width * scale,
        height: rect.height * scale
    });
    if (typeof extraFunctions === 'function') {
        extraFunctions = [extraFunctions];
    }
    if (Array.isArray(extraFunctions)) {
        for (const extraFunction of extraFunctions) {
            if (typeof extraFunction === 'function')
                await page.evaluate(extraFunction, extraFunctionArgs);
        }
    }

    let base64 = await page.renderBase64(format);
    await instance.exit();
    return base64;
}

async function submitBuffer(code, buffer) {
    console.worker('Finished, submitting as base64');
    process.send({
        cmd: 'img',
        code: code,
        buffer: typeof buffer === 'string' ? buffer : buffer.toString('base64')
    });
}

function getBufferFromIM(data) {
    return new Promise((resolve, reject) => {
        // data.stream((err, stdout, stderr) => {
        //     if (err) { console.error(err.stack); return reject(err.stack) }
        //     const chunks = []
        //     stdout.on('data', (chunk) => { chunks.push(chunk) })
        //     // these are 'once' because they can and do fire multiple times for multiple errors,
        //     // but this is a promise so you'll have to deal with them one at a time
        //     stdout.once('end', () => { console.debug('done! ' + chunks.length); resolve(Buffer.concat(chunks)) })
        //     const errChunks = [];
        //     stderr.on('data', (data) => { errChunks.push(data) });
        //     stderr.once('end', () => { reject(Buffer.concat(errChunks).toString()) });
        // })
        data.setFormat('png').toBuffer(function (err, buffer) {
            if (err) {
                reject(err);
                return;
            }
            resolve(buffer);
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
            fulfill(buffer);
        });
    });
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
        console.debug(`Generating caption for text '${options.text}'`);

        let image = im().command('convert');

        image.font(path.join(__dirname, '..', '..', 'res', 'img', 'fonts', options.font));
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
                console.error(`Failed to generate a caption: '${options.text}'`);
                reject(err);
                return;
            }
            console.debug(`Caption generated: '${options.text}'`);
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
    return new Promise(async function (fulfill, reject) {
        url = url.trim();
        if (url.startsWith('<') && url.endsWith('>')) {
            url = url.substring(1, url.length - 1);
        }
        console.debug(url);
        let r = await aRequest({
            uri: url
        });
        if (r.res.headers['content-type'] == 'image/gif') {
            getBufferFromIM(gm(r.body, 'temp.gif').selectFrame(1).setFormat('png'))
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

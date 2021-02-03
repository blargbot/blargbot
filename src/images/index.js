const phantom = require('phantom');

const { ImageGenerator } = require('./ImageGenerator');
const { ColorGenerator } = require('./ColorGenerator');
const { FreeGenerator } = require('./FreeGenerator');
const { CaptionGenerator } = require('./CaptionGenerator');
const { CAHGenerator } = require('./CAHGenerator');
const { RetardedGenerator } = require('./RetardedGenerator');
const { ClippyGenerator } = require('./ClippyGenerator');
const { TruthGenerator } = require('./TruthGenerator');
const { ShitGenerator } = require('./ShitGenerator');
const { ArtGenerator } = require('./ArtGenerator');
const { ClintGenerator } = require("./ClintGenerator");
const { PixelateGenerator } = require("./PixelateGenerator");
const { TriggeredGenerator } = require("./TriggeredGenerator");
const { TheSearchGenerator } = require("./TheSearchGenerator");
const { ClydeGenerator } = require("./ClydeGenerator");
const { DeleteGenerator } = require("./DeleteGenerator");
const { StarVsTheForcesOfGenerator } = require("./StarVsTheForcesOfGenerator");
const { DistortGenerator } = require("./DistortGenerator");
const { SonicSaysGenerator } = require("./SonicSaysGenerator");
const { PCCheckGenerator } = require("./PCCheckGenerator");

class ImageProcessor {
    constructor(logger) {
        this.logger = logger;
        /** @type {Object.<string, ImageGenerator>} */
        this.generators = {
            color: new ColorGenerator(logger),
            free: new FreeGenerator(logger),
            caption: new CaptionGenerator(logger),
            cah: new CAHGenerator(logger),
            retarded: new RetardedGenerator(logger),
            clippy: new ClippyGenerator(logger),
            truth: new TruthGenerator(logger),
            shit: new ShitGenerator(logger),
            art: new ArtGenerator(logger),
            clint: new ClintGenerator(logger),
            pixelate: new PixelateGenerator(logger),
            triggered: new TriggeredGenerator(logger),
            thesearch: new TheSearchGenerator(logger),
            clyde: new ClydeGenerator(logger),
            delete: new DeleteGenerator(logger),
            starvstheforcesof: new StarVsTheForcesOfGenerator(logger),
            distort: new DistortGenerator(logger),
            sonicsays: new SonicSaysGenerator(logger),
            pccheck: new PCCheckGenerator(logger)
        };
    }
};

module.exports = { ImageProcessor, ImageGenerator };

async function renderPhantom(file, replaces, scale = 1, format = 'PNG', extraFunctions, extraFunctionArgs) {
    const instance = await phantom.create(['--ignore-ssl-errors=true', '--ssl-protocol=TLSv1']);
    const page = await instance.createPage();

    page.on('onConsoleMessage', (msg) => {
        this.logger.debug('[IM]', msg);
    });
    page.on('onResourceError', (resourceError) => {
        this.logger.error(resourceError.url + ': ' + resourceError.errorString);
    });

    let dPath = path.join(__dirname, '..', '..', 'res', 'img', file).replace(/\\/g, '/').replace(/^\w:/, '');;
    const status = await page.open(dPath);

    await page.on('viewportSize', { width: 1440, height: 900 });
    await page.on('zoomFactor', scale);

    const self = this;

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
            self.logger.error(err);
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

function getResize(logger) {
    return function resize() {
        var el, _i, _len, _results;
        const elements = document.getElementsByClassName('resize');
        const wrapper = document.getElementById('wrapper');
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
                    logger.log(elNewFontSize);
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
}

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
        /** @type {Object.<string, import('./ImageGenerator').ImageGenerator>} */
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

    /**
     * @param {string} method
     * @param {object} args
     * @returns {Promise<Buffer>}
     */
    async execute(method, args) {
        if (!(method in this.generators))
            return Buffer.from('');

        try {
            return await this.generators[method].execute(args);
        } catch (err) {
            let message = err instanceof Error ? err.stack : err;
            this.logger.error(`An error occurred while generating ${method}: ${message}`);
            return Buffer.from('');
        }
    }
}

module.exports = { ImageProcessor };
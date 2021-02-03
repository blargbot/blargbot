const { ImageGenerator } = require('./ImageGenerator');
const Jimp = require('jimp');

class PixelateGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ url, scale }) {
        let image = await this.getRemote(url);
        if (image.bitmap.width >= image.bitmap.height) {
            image.resize(scale, Jimp.AUTO);
            image.resize(256, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR);
        } else {
            image.resize(Jimp.AUTO, scale);
            image.resize(Jimp.AUTO, 256, Jimp.RESIZE_NEAREST_NEIGHBOR);
        }

        return await this.toBuffer(image);
    }
}
module.exports = { PixelateGenerator };

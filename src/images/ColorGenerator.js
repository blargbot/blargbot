const { ImageGenerator } = require('./ImageGenerator');

class ColorGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ hex }) {
        let img = this.canvas(128, 128, hex);
        return await this.toBuffer(img);
    }
};

module.exports = { ColorGenerator };
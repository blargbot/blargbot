const { ImageGenerator } = require('./ImageGenerator');

class SonicSaysGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ text }) {
        return await renderPhantom('sonicsays.html', { replace1: text }, 2, undefined, [getResize(this.logger)], undefined);
    }


}
module.exports = { SonicSaysGenerator };

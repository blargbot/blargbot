const { ImageGenerator } = require('./ImageGenerator');

class SonicSaysGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ text }) {
        return await this.renderPhantom('sonicsays.html', {
            scale: 2,
            replacements: {
                "replace1": text
            }
        });
    }


}
module.exports = { SonicSaysGenerator };

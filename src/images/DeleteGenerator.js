const { ImageGenerator } = require('./ImageGenerator');

class DeleteGenerator extends ImageGenerator {
    constructor(logger) {
        super(logger);
    }

    async execute({ text }) {
        let originalText = await this.renderText(text, {
            font: 'whitneybold.ttf',
            size: '512x24',
            gravity: 'South',
            fill: '#f8f8f8'
        });

        let body = this.canvas(originalText.bitmap.width, originalText.bitmap.height + 8);
        body.composite(originalText, 0, 4);
        body.autocrop();
        let iterations = Math.ceil(body.bitmap.width / 64);
        this.logger.debug(body.bitmap.width);
        let delete1 = await this.getLocal(`delete1.png`);
        let delete2 = await this.getLocal(`delete2.png`);
        let delete3 = await this.getLocal(`delete3.png`);
        let cursor = await this.getLocal(`cursor.png`);
        let width = 128 + (iterations * 64);
        let workspace = this.canvas(width, 84);
        workspace.composite(delete1, 0, 0);
        workspace.composite(delete3, width - 64, 0);
        for (let i = 0; i < iterations; i++) {
            workspace.composite(delete2, (i + 1) * 64, 0);
        }
        workspace.composite(body, 64 + ((iterations * 64 - body.bitmap.width + 32) / 2), 14 + ((48 - body.bitmap.height) / 2));
        workspace.composite(cursor, 64 + ((iterations * 64 - cursor.bitmap.width + 32) / 2), 48);

        return await this.toBuffer(workspace);
    }
}

module.exports = { DeleteGenerator };

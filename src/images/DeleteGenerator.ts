import Jimp from 'jimp';
import { BaseImageGenerator } from '../structures/BaseImageGenerator'

export class DeleteGenerator extends BaseImageGenerator {
    constructor(logger: CatLogger) {
        super(logger);
    }

    async execute({ text }: JObject) {
        if (typeof text !== 'string')
            return null;

        let originalText = await this.renderJimpText(text, {
            font: 'whitneybold.ttf',
            size: '512x24',
            gravity: 'South',
            fill: '#f8f8f8'
        });

        let body = new Jimp(originalText.bitmap.width, originalText.bitmap.height + 8);
        body.composite(originalText, 0, 4);
        body.autocrop();
        let iterations = Math.ceil(body.bitmap.width / 64);
        this.logger.debug(body.bitmap.width);
        let delete1 = await this.getLocalJimp(`delete1.png`);
        let delete2 = await this.getLocalJimp(`delete2.png`);
        let delete3 = await this.getLocalJimp(`delete3.png`);
        let cursor = await this.getLocalJimp(`cursor.png`);
        let width = 128 + (iterations * 64);
        let workspace = new Jimp(width, 84);
        workspace.composite(delete1, 0, 0);
        workspace.composite(delete3, width - 64, 0);
        for (let i = 0; i < iterations; i++) {
            workspace.composite(delete2, (i + 1) * 64, 0);
        }
        workspace.composite(body, 64 + ((iterations * 64 - body.bitmap.width + 32) / 2), 14 + ((48 - body.bitmap.height) / 2));
        workspace.composite(cursor, 64 + ((iterations * 64 - cursor.bitmap.width + 32) / 2), 48);

        return workspace.getBufferAsync(Jimp.MIME_PNG);
    }
}


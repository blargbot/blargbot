import { Logger } from '@core/Logger';
import { mapping, randInt } from '@core/utils';
import { BaseImageGenerator } from '@image/BaseImageGenerator';
import { JimpGifEncoder } from '@image/JimpGifEncoder';
import { FreeOptions } from '@image/types';
import Jimp from 'jimp';

export class FreeGenerator extends BaseImageGenerator<'free'> {
    public constructor(logger: Logger) {
        super('free', logger, mapOptions);
    }

    public async executeCore({ top, bottom }: FreeOptions): Promise<Buffer> {
        const topCaption = await this.renderJimpText(top, {
            font: 'impact.ttf',
            fill: 'white',
            stroke: 'black',
            strokewidth: '5',
            gravity: 'north',
            size: '380x100'
        });
        const bottomText = bottom ?? 'CLICK HERE TO\nFIND OUT HOW';
        const bottomCaption = await this.renderJimpText(bottomText, {
            font: 'arial.ttf',
            fill: 'white',
            gravity: 'center',
            size: '380x70'
        });

        const back1 = await this.getLocalJimp('freefreefree0.png');
        const back2 = await this.getLocalJimp('freefreefree1.png');

        const frameCount = 6;
        const base = new Jimp(400, 300);
        const gif = new JimpGifEncoder({ width: 400, height: 300, delay: 50 });
        for (let i = 0; i < frameCount; i++) {
            const frame = base.clone();
            frame.composite(i < frameCount / 2 ? back1 : back2, 0, 0);
            frame.composite(topCaption, i === 0 ? 10 : randInt(-25, 25), i === 0 ? 15 : randInt(0, 20));
            frame.composite(bottomCaption, 10, 228);
            gif.addFrame(frame);
        }
        return await gif.render();
    }

}

const mapOptions = mapping.mapObject<FreeOptions>({
    top: mapping.mapString,
    bottom: mapping.mapOptionalString
});

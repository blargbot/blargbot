import { BaseApiImageGenerator } from '@blargbot/image/BaseApiImageGenerator.js';
import type { ImageWorker } from '@blargbot/image/ImageWorker.js';

export class ColorGenerator extends BaseApiImageGenerator<'color'> {
    public constructor(worker: ImageWorker) {
        super('color', worker);
    }
}

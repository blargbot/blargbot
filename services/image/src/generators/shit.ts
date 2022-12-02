import { BaseApiImageGenerator } from '@blargbot/image/BaseApiImageGenerator.js';
import { ImageWorker } from '@blargbot/image/ImageWorker.js';

export class ShitGenerator extends BaseApiImageGenerator<'shit'> {
    public constructor(worker: ImageWorker) {
        super('shit', worker);
    }
}

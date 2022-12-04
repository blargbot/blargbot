import { BaseApiImageGenerator } from '@blargbot/image/BaseApiImageGenerator.js';
import type { ImageWorker } from '@blargbot/image/ImageWorker.js';

export class ShitGenerator extends BaseApiImageGenerator<'shit'> {
    public constructor(worker: ImageWorker) {
        super('shit', worker);
    }
}

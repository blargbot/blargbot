import { BaseApiImageGenerator } from '@blargbot/image/BaseApiImageGenerator.js';
import type { ImageWorker } from '@blargbot/image/ImageWorker.js';

export class TheSearchGenerator extends BaseApiImageGenerator<'thesearch'> {
    public constructor(worker: ImageWorker) {
        super('thesearch', worker);
    }
}

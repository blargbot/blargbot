import { BaseApiImageGenerator } from '@blargbot/image/BaseApiImageGenerator.js';
import type { ImageWorker } from '@blargbot/image/ImageWorker.js';

export class LinusGeneratorGenerator extends BaseApiImageGenerator<'linus'> {
    public constructor(worker: ImageWorker) {
        super('linus', worker);
    }
}

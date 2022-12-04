import { BaseApiImageGenerator } from '@blargbot/image/BaseApiImageGenerator.js';
import type { ImageWorker } from '@blargbot/image/ImageWorker.js';

export class ClintGenerator extends BaseApiImageGenerator<'clint'> {
    public constructor(worker: ImageWorker) {
        super('clint', worker);
    }
}

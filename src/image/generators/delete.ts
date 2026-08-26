import { BaseApiImageGenerator } from '@blargbot/image/BaseApiImageGenerator.js';
import type { ImageWorker } from '@blargbot/image/ImageWorker.js';

export class DeleteGenerator extends BaseApiImageGenerator<'delete'> {
    public constructor(worker: ImageWorker) {
        super('delete', worker);
    }
}

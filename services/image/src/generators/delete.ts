import { BaseApiImageGenerator } from '@blargbot/image/BaseApiImageGenerator.js';
import { ImageWorker } from '@blargbot/image/ImageWorker.js';

export class DeleteGenerator extends BaseApiImageGenerator<'delete'> {
    public constructor(worker: ImageWorker) {
        super('delete', worker);
    }
}

import { BaseApiImageGenerator } from '@blargbot/image/BaseApiImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';

export class DeleteGenerator extends BaseApiImageGenerator<'delete'> {
    public constructor(worker: ImageWorker) {
        super('delete', worker);
    }
}

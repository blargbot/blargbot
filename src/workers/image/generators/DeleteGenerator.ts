import { BaseApiImageGenerator } from '@image/BaseApiImageGenerator';
import { ImageWorker } from '@image/ImageWorker';

export class DeleteGenerator extends BaseApiImageGenerator<'delete'> {
    public constructor(worker: ImageWorker) {
        super('delete', worker);
    }
}

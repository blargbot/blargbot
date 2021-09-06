import { BaseApiImageGenerator } from '@image/BaseApiImageGenerator';
import { ImageWorker } from '@image/ImageWorker';

export class PCCheckGenerator extends BaseApiImageGenerator<'pccheck'> {
    public constructor(worker: ImageWorker) {
        super('pccheck', worker);
    }
}

import { BaseApiImageGenerator } from '@image/BaseApiImageGenerator';
import { ImageWorker } from '@image/ImageWorker';

export class ColorGenerator extends BaseApiImageGenerator<'color'> {
    public constructor(worker: ImageWorker) {
        super('color', worker);
    }
}

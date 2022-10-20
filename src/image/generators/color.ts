import { BaseApiImageGenerator } from '@blargbot/image/BaseApiImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';

export class ColorGenerator extends BaseApiImageGenerator<'color'> {
    public constructor(worker: ImageWorker) {
        super('color', worker);
    }
}

import { BaseApiImageGenerator } from '@blargbot/image/BaseApiImageGenerator';
import { ImageWorker } from '@blargbot/image/ImageWorker';

export class ClintGenerator extends BaseApiImageGenerator<'clint'> {
    public constructor(worker: ImageWorker) {
        super('clint', worker);
    }
}

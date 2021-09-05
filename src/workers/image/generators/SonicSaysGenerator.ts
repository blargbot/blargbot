import { BaseApiImageGenerator } from '@image/BaseApiImageGenerator';
import { ImageWorker } from '@image/ImageWorker';

export class SonicSaysGenerator extends BaseApiImageGenerator<'sonicsays'> {
    public constructor(worker: ImageWorker) {
        super('sonicsays', worker);
    }
}

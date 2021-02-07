import { WorkerConnection } from './core/WorkerConnection';

export class ImageConnection extends WorkerConnection {
    public constructor(
        id: number,
        logger: CatLogger
    ) {
        super(id.toString(), 'image', logger);
    }
}
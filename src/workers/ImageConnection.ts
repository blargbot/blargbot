import { ImageContract } from './ImageContract';
import { WorkerConnection } from './core/WorkerConnection';

export class ImageConnection extends WorkerConnection<ImageContract> {
    public constructor(
        id: number,
        logger: CatLogger
    ) {
        super(id, 'image', logger);
    }

    public async render(type: string, data: Record<string, unknown>): Promise<Buffer | null> {
        const result = await this.request('img', { command: type, ...data });
        if (typeof result === 'string')
            return Buffer.from(result, 'base64');
        return null;
    }
}
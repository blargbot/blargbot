import { ImageModuleLoader } from '../../core/ImageModuleLoader';

export class ImageWorker {
    public readonly renderers: ImageModuleLoader;
    constructor(
        public readonly process: NodeJS.Process,
        public readonly logger: WorkerLogger
    ) {
        this.process.on('unhandledRejection', (err, p) => {
            logger.error('Unhandled Promise Rejection: Promise' + JSON.stringify(err));
        });

        this.logger.init(`IMAGE WORKER (pid ${this.process.pid}) PROCESS INITIALIZED`);

        this.renderers = new ImageModuleLoader(this.logger, 'images');
    }

    async render(command: string, message: JObject) {
        let generator = this.renderers.get(command);
        if (!generator)
            return Buffer.from('');

        try {
            return await generator.execute(message);
        } catch (err) {
            let message = err instanceof Error ? err.stack : err;
            this.logger.error(`An error occurred while generating ${command}: ${message}`);
            return Buffer.from('');
        }
    }


    async start() {
        await Promise.all([
            this.renderers.init()
        ])
        this.process.on('message', async (msg) => {
            if (msg.cmd !== 'img')
                return;

            let buffer = await this.render(msg.command, msg);
            this.logger.worker('Finished, submitting as base64');
            process.send!({
                cmd: 'img',
                code: msg.code,
                buffer: buffer?.toString('base64') ?? ''
            });
        });
    }
}
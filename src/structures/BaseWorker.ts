export abstract class BaseWorker {
    constructor(
        public readonly process: NodeJS.Process,
        public readonly logger: CatLogger
    ) {
        this.process.on('unhandledRejection', (err, p) => {
            this.logger.error('Unhandled Promise Rejection: Promise' + JSON.stringify(err));
        });

        if ('send' in this.process) {
            this.logger.addPostHook(({ text, level, timestamp }) => {
                this.process.send!(JSON.stringify({ code: 'log', data: { text, level, timestamp } }));
                return null;
            });
        }
    }
}
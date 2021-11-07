export class BBTagRuntimeError extends Error {
    public constructor(
        message: string,
        public readonly detail?: string
    ) {
        super(message);
    }
}

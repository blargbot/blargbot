export class BBTagRuntimeError extends Error {
    public display?: string;

    public constructor(
        message: string,
        public readonly detail?: string
    ) {
        super(message);
    }

    public withDisplay(error?: string): this {
        this.display = error;
        return this;
    }
}

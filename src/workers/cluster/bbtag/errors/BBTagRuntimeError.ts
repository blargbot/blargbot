export class BBTagRuntimeError extends Error {
    public readonly bberror: `\`${string}\``;

    public constructor(
        message: string,
        public readonly detail?: string
    ) {
        super(message);
        this.bberror = `\`${this.message}\``;
    }
}

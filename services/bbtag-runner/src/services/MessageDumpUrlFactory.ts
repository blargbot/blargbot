export class MessageDumpUrlFactory {
    readonly #baseUrl: URL;

    public constructor(baseUrl: string) {
        this.#baseUrl = new URL(baseUrl);
    }

    public getUrl(id: bigint | string): URL {
        return new URL(id.toString(), this.#baseUrl);
    }
}

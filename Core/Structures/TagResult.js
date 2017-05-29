class TagResult {
    constructor(client, params) {
        this.client = client;
        this.terminate = params.terminate;
        this.content = '';
        this.replace = false;
    }
}
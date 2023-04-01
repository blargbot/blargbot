import { BBTagRuntimeError, FetchRequest, FetchResponse, FetchService as BBTagFetchService } from "@bbtag/blargbot";
import fetch from "node-fetch";
import { Cluster } from "../../Cluster.js";

const domainRegex = /^https?:\/\/(.+?)(?:\/.?|$)/i;

export class FetchService implements BBTagFetchService {

    public constructor(public readonly cluster: Cluster) {
    }

    public async send(url: string, init?: FetchRequest | undefined): Promise<FetchResponse> {
        const domainMatch = domainRegex.exec(url);
        if (domainMatch === null)
            throw new BBTagRuntimeError(`A domain could not be extracted from url: ${url}`);

        const domain = domainMatch[1];
        if (!this.cluster.domains.isWhitelisted(domain))
            throw new BBTagRuntimeError(`Domain is not whitelisted: ${domain}`);

        return await fetch(url, init);
    }
}
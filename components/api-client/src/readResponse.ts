export async function readResponse<Type>(content: Blob): Promise<Type>
export async function readResponse(content: Blob): Promise<unknown> {
    switch (content.type.split(';')[0].trim()) {
        case '': return undefined;
        case 'application/json': return JSON.parse(await content.text());
    }

    throw new Error(`Unsupported content type ${content.type}`);
}

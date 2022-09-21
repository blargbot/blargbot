import http from 'http';
import stream from 'stream';

export interface ResponseMessage {
    statusCode: number;
    headers: http.IncomingHttpHeaders;
    body: stream.Readable;
}

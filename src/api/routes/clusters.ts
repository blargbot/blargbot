import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { ClusterStats } from '@blargbot/cluster/types';
import { WebSocket } from 'ws';

export class ClustersRoute extends BaseRoute {
    #clusterStats: Record<number, ClusterStats | undefined>;
    readonly #sockets: Set<WebSocket>;
    readonly #api: Api;

    public constructor(api: Api) {
        super('/clusters');

        this.#clusterStats = {};
        this.#sockets = new Set();
        this.#api = api;

        this.#api.worker.on('clusterStats', ({ data }) => {
            this.#clusterStats = data;
            this.#api.logger.verbose('Sending cluster stats to', this.#sockets.size, 'connected clients');
            for (const socket of this.#sockets)
                socket.send(JSON.stringify(data));
        });

        this.addRoute('/', {
            get: () => this.getClusters(),
            ws: ({ socket }) => {
                this.#sockets.add(socket);
                socket.onclose = () => this.#sockets.delete(socket);
                socket.send(JSON.stringify(this.#clusterStats));
            }
        });
    }

    public getClusters(): ApiResponse {
        return this.ok(this.#clusterStats);
    }
}

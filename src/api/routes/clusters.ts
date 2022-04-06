import { Api } from '@blargbot/api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { ClusterStats } from '@blargbot/cluster/types';

export class ClustersRoute extends BaseRoute {
    #clusterStats: Record<number, ClusterStats | undefined>;

    public constructor(private readonly api: Api) {
        super('/clusters');

        this.#clusterStats = {};
        const sockets: Set<WebSocket> = new Set();

        this.api.worker.on('clusterStats', ({ data }) => {
            this.#clusterStats = data;
            this.api.logger.verbose('Sending cluster stats to', sockets.size, 'connected clients');
            for (const socket of sockets)
                socket.send(JSON.stringify(data));
        });

        this.addRoute('/', {
            get: () => this.getClusters()
        });

        this.addWebsocket('/', (ws) => {
            sockets.add(ws);
            ws.onclose = () => sockets.delete(ws);
            ws.send(JSON.stringify(this.#clusterStats));
        });
    }

    public getClusters(): ApiResponse {
        return this.ok(this.#clusterStats);
    }
}

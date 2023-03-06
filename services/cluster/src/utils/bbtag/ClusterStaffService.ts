import type { Entities, StaffService } from '@bbtag/blargbot';

import type { Cluster } from '../../Cluster.js';

export class ClusterStaffService implements StaffService {

    public constructor(public readonly cluster: Cluster) {
    }

    public isUserStaff(member: Entities.User): Promise<boolean> {
        // @ts-expect-error This is only a reference file for now
        return this.cluster.util.isUserStaff(member);
    }
}

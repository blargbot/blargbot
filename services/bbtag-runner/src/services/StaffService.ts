import type { Entities, StaffService as BBTagStaffService } from '@bbtag/blargbot';

export class StaffService implements BBTagStaffService {
    public isUserStaff(member: Entities.User): Promise<boolean> {
        member;
        throw new Error('Method not implemented.');
    }
}

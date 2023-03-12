import type { Entities } from '../types.js';

export interface StaffService {
    isUserStaff(member: Entities.User): Promise<boolean>;
}

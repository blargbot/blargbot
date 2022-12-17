import fs from 'node:fs/promises';
import path from 'node:path';

const [cpuset, hostname] = await Promise.all([
    fs.readFile('/proc/1/cpuset', { encoding: 'utf-8' }),
    fs.readFile('/etc/hostname', { encoding: 'utf-8' })
]);

export const fullContainerId = path.basename(cpuset).trim();
export const containerId = path.basename(hostname).trim();
export default containerId;

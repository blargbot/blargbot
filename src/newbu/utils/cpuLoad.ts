import os from 'os'

function getTotalCpuTime() {
    const cpus = os.cpus();
    return cpus.reduce(
        (acc, cur) => acc
            + cur.times.user
            + cur.times.nice
            + cur.times.sys
            + cur.times.idle
            + cur.times.irq,
        0
    ) / cpus.length;
}


let lastTotalCpuTime: number = 0;
let lastUserCpuTime: number = 0;
let lastSystemCpuTime: number = 0;

export function cpuLoad() {
    const totalCpuTime = getTotalCpuTime();
    const cpuUsage = process.cpuUsage();
    const userTime = cpuUsage.user / 1000;
    const systemTime = cpuUsage.system / 1000;

    const totalDiff = totalCpuTime - lastTotalCpuTime;
    const userDiff = userTime - lastUserCpuTime;
    const systemDiff = systemTime - lastSystemCpuTime;
    lastTotalCpuTime = totalCpuTime;
    lastUserCpuTime = userTime;
    lastSystemCpuTime = systemTime;

    return {
        userCpu: userDiff / totalDiff * 100,
        systemCpu: systemDiff / totalDiff * 100
    };
}
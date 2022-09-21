export const auditReasonHeader = ['X-Audit-Log-Reason', (params: { auditReason?: string; }) => {
    const reason = params.auditReason;
    if (reason === undefined)
        return undefined;
    return encodeURIComponent(reason);
}] as const;

export const auditReasonHeaderUnencoded = ['X-Audit-Log-Reason', (params: { auditReason?: string; }) => {
    const reason = params.auditReason;
    if (reason === undefined)
        return undefined;
    return reason;
}] as const;

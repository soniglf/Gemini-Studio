
// This service has been removed as per user request to disable "Live" chat features.
// The file is kept empty to avoid breaking legacy imports until full cleanup.
export class LiveService {
    constructor() {}
    async connect() { throw new Error("Live Service Disabled"); }
    async disconnect() {}
}

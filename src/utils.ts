// simple logging functions
export function info(...msg: any[]): void {
    console.log(`[SemanticSearch Plugin][INFO] ${msg}`);
}

export function debug(...msg: any[]): void {
    // if (configs.get('inDev')) {
    //     console.log(`[BgCover Plugin][DEBUG]`, ...msg);
    // }
    console.log(`[SemanticSearch Plugin][DEBUG]`, ...msg);
}

export function error(...msg: any[]): void {
    console.error(`[SemanticSearch Plugin][ERROR] ${msg}`);
}

export function warn(...msg: any[]): void {
    console.warn(`[SemanticSearch Plugin][WARN] ${msg}`);
}
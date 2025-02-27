export enum LogLevel {
    Error,
    Warn,
    Log,
    Info,
    Trace,
}

export class Logger {
    static level: LogLevel = LogLevel.Error;
    static error(...data: unknown[]): void;
    static error(message?: unknown, ...optionalParams: unknown[]) {
        if (Logger.level >= LogLevel.Error) {
            console.error(message, ...optionalParams);
        }
    }
    static warn(...data: unknown[]): void;
    static warn(message?: unknown, ...optionalParams: unknown[]) {
        if (Logger.level >= LogLevel.Warn) {
            console.warn(message, ...optionalParams);
        }
    }
    static log(...data: unknown[]): void;
    static log(message?: unknown, ...optionalParams: unknown[]): void {
        if (Logger.level >= LogLevel.Log) {
            console.log(message, ...optionalParams);
        }
    }
    static info(...data: unknown[]): void;
    static info(message?: unknown, ...optionalParams: unknown[]): void {
        if (Logger.level >= LogLevel.Info) {
            console.info(message, ...optionalParams);
        }
    }
    static trace(...data: unknown[]): void;
    static trace(message?: unknown, ...optionalParams: unknown[]): void {
        if (Logger.level >= LogLevel.Trace) {
            console.trace(message, ...optionalParams);
        }
    }
    static table(tabularData: unknown, properties?: readonly string[] | undefined): void;
    static table(tabularData: unknown, properties?: string[] | undefined): void {
        if (Logger.level >= LogLevel.Log) {
            console.table(tabularData, properties);
        }
    }
    static time(label: string | undefined): void {
        if (Logger.level >= LogLevel.Trace) {
            console.time(label);
        }
    }
    static timeEnd(label: string | undefined): void {
        if (Logger.level >= LogLevel.Trace) {
            console.timeEnd(label);
        }
    }
    static count(label: string | undefined): void {
        if (Logger.level >= LogLevel.Trace) {
            console.count(label);
        }
    }
    static countReset(label: string | undefined): void {
        if (Logger.level >= LogLevel.Trace) {
            console.countReset(label);
        }
    }

}
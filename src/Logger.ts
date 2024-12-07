export enum LogLevel {
    Error,
    Warn,
    Log,
    Info,
    Trace,
}

export class Logger {
    static level: LogLevel = LogLevel.Error;
    static error(...data: any[]): void;
    static error(message?: any, ...optionalParams: any[]) {
        if (Logger.level >= LogLevel.Error) {
            console.error(message, ...optionalParams);
        }
    }
    static warn(...data: any[]): void;
    static warn(message?: any, ...optionalParams: any[]) {
        if (Logger.level >= LogLevel.Warn) {
            console.warn(message, ...optionalParams);
        }
    }
    static log(...data: any[]): void;
    static log(message?: any, ...optionalParams: any[]): void {
        if (Logger.level >= LogLevel.Log) {
            console.log(message, ...optionalParams);
        }
    }
    static info(...data: any[]): void;
    static info(message?: any, ...optionalParams: any[]): void {
        if (Logger.level >= LogLevel.Info) {
            console.info(message, ...optionalParams);
        }
    }
    static trace(...data: any[]): void;
    static trace(message?: any, ...optionalParams: any[]): void {
        if (Logger.level >= LogLevel.Trace) {
            console.trace(message, ...optionalParams);
        }
    }
    static table(tabularData: any, properties?: readonly string[] | undefined): void;
    static table(tabularData: any, properties?: string[] | undefined): void {
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
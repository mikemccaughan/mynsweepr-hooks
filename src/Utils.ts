export class Utils {
    public static hasKeys(value: Record<string, unknown>): boolean;
    public static hasKeys(value: object): boolean {
        if (!Utils.isGood(value)) {
            return false;
        }
        try {
            const keys = Object.keys(value);
            return keys.length > 0;
        } catch {
            return false;
        }
    }
    public static isGood<T>(value: T | undefined | null): value is T {
        return typeof value !== 'undefined' && value !== null;
    }
    public static isGoodNumber(value: unknown): value is number {
        return Utils.isGood(value) && !Number.isNaN(value) && !isNaN(Number(value));
    }
    public static isGoodString(value: unknown, minLength = 1, maxLength = Number.MAX_SAFE_INTEGER): value is string {
        return Utils.isGood(value) && typeof value === 'string' && value.length >= minLength && value.length <= maxLength;
    }
    public static isGoodArray(value: unknown, minCount = 1, maxCount = Number.MAX_SAFE_INTEGER): value is Array<unknown> {
        return Utils.isGood(value) && Array.isArray(value) && value.length >= minCount && value.length <= maxCount;
    }
    public static asGoodNumber(value: unknown): number {
        if (Utils.isGoodNumber(value)) {
            return Number(value);
        }

        return 0;
    }
    public static asGoodString(value: unknown): string {
        if (Utils.isGoodString(value)) {
            return String(value);
        }

        return '';
    }
    public static asGoodArray(value: unknown): Array<unknown> {
        if (Utils.isGoodArray(value)) {
            return value;
        }

        return [];
    }
    public static getDimensionCount(arr: Array<unknown>): number {
        let dimCount = 0;
        if (Utils.isGoodArray(arr)) {
            dimCount = 1;
            dimCount = arr.reduce(
                (agg, cur) => 
                    Utils.asGoodNumber(agg) as number + 
                    (Utils.isGoodArray(cur) ? Utils.getDimensionCount(cur) : 0), 
                dimCount
            ) as number;
        }

        return dimCount;
    }
    public static getCurrentDifficulty(): string | null {
        const diffRadio = window.document.querySelector('input[name="difficulty"]:checked') as HTMLInputElement;
        if (diffRadio === null) {
            return null;
        }

        let diff: string = diffRadio.value;
        if (diff === '?') {
            diff = `?:${(document.querySelector('#width') as HTMLInputElement)?.value}x${(document.querySelector('#height') as HTMLInputElement)?.value}`;
        }

        return diff;
    }
    public static parseSeconds(value: string | undefined | null): number {
        if (!Utils.isGoodString(value)) {
            return Number.NEGATIVE_INFINITY;
        }
        const timeRe = /^(\d+):(\d{1,2}):(\d{1,2})$/;
        if (!timeRe.test(value)) {
            return Number.NEGATIVE_INFINITY;
        }
        const matches = timeRe.exec(value);
        if (!Utils.isGood(matches)) {
            return Number.NEGATIVE_INFINITY;
        }
        if (Utils.isGoodString(matches[1]) &&
            Utils.isGoodString(matches[2]) &&
            Utils.isGoodString(matches[3])) {
            let timeInSeconds = Utils.asGoodNumber(matches[1]) * 60 * 60;
            timeInSeconds += Utils.asGoodNumber(matches[2]) * 60;
            timeInSeconds += Utils.asGoodNumber(matches[3]);
            return timeInSeconds;
        }

        return Number.NEGATIVE_INFINITY;
    }
}
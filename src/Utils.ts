export class Utils {
    public static isGood(value: unknown): boolean {
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
}
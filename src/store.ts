import { Utils } from "./Utils";

export type StoreType = 'local' | 'session' | 'memory' | 'cookie';
export type DefaultStoreType = 'local';
export interface IStorage {
    prefix: string;
    length: number;
    key(index: number): string | null;
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
}
export class Store implements IStorage {
    private _prefix = 'hm.store.';
    private _type: StoreType | 'default' = 'default';
    private static _defaultType: StoreType = 'local';
    private _backer: IStorage;
    constructor(type: StoreType = Store._defaultType, prefix?: string) {
        this._type = type;
        this._backer = Store.createInstance(type, prefix);
    }
    public static createInstance(type: StoreType, prefix?: string): IStorage {
        prefix ??= 'hm.store.';
        switch (type) {
            case 'cookie':
                return new CookieStore(type, prefix);
            case 'local':
                return new LocalStore(type, prefix);
            case 'session':
                return new SessionStore(type, prefix);
            case 'memory':
                return new MemoryStore(type, prefix);
        }
    }
    public get length(): number {
        return this._backer.length;
    }
    public get prefix(): string {
        return this._prefix;
    }
    public set prefix(value: string) {
        if (this._prefix !== value) {
            this._prefix = value;
            this._backer.prefix = value;
        }
    }
    key(index: number): string | null {
        return this._backer.key(index);
    }
    getItem(key: string): string | null {
        return this._backer.getItem(key);
    }
    setItem(key: string, value: string): void {
        this._backer.setItem(key, value);
    }
    removeItem(key: string): void {
        this._backer.removeItem(key);
    }
    clear(): void {
        this._backer.clear();
    }    
}

abstract class BaseStore implements IStorage {
    private _prefix: string;
    constructor(_type: StoreType, prefix: string) {
        this._prefix = prefix;
    }
    public get prefix(): string {
        return this._prefix;
    }
    public set prefix(value: string) {
        if (this._prefix !== value) {
            // replace items already stored with _prefix to start with value instead
            const keys = Array
                .from(
                    { length: this.length }, 
                    (_: unknown, i: number) => this.key(i)?.startsWith(this._prefix) ? this.key(i) : undefined
                );
            const keysWithPrefix = keys.filter(x => Utils.isGood(x));
            for (const key of keysWithPrefix) {
                if (!Utils.isGood(key)) {
                    continue;
                }
            }
            this._prefix = value;
        }
    }    
    public abstract get length(): number;
    abstract key(index: number): string | null;
    protected fixKey(key: string): string {
        return key.startsWith(this.prefix) ? key : `${this.prefix}.${key}`;
    }
    abstract getItem(key: string): string | null;
    abstract setItem(key: string, value: string): void;
    abstract removeItem(key: string): void;
    abstract clear(): void;
}

class MemoryStore extends BaseStore implements IStorage {
    private _backingMap: Map<string, string> = new Map();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_type: StoreType = 'memory', prefix: string) {
        super(_type, prefix);
    }
    public get length(): number {
        return this._backingMap.size;
    }
    key(index: number): string | null {
        return [...this._backingMap.keys()][index];
    }
    getItem(key: string): string | null {
        return this._backingMap.has(this.fixKey(key)) ? this._backingMap.get(this.fixKey(key)) ?? null : null;
    }
    setItem(key: string, value: string): void {
        this._backingMap.set(this.fixKey(key), value);
    }
    removeItem(key: string): void {
        this._backingMap.delete(this.fixKey(key));
    }
    clear(): void {
        this._backingMap.clear();
    }
}

class SessionStore extends BaseStore implements IStorage {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_type: StoreType = 'session', prefix: string) {
        super(_type, prefix);
    }
    public get length(): number {
        return window.sessionStorage.length;
    }
    key(index: number): string | null {
        return window.sessionStorage.key(index);
    }
    getItem(key: string): string | null {
        return window.sessionStorage.getItem(this.fixKey(key));
    }
    setItem(key: string, value: string): void {
        window.sessionStorage.setItem(this.fixKey(key), value);
    }
    removeItem(key: string): void {
        window.sessionStorage.removeItem(this.fixKey(key));
    }
    clear(): void {
        window.sessionStorage.clear();
    }
}

class LocalStore extends BaseStore implements IStorage {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_type: StoreType = 'local', prefix: string) {
        super(_type, prefix);
    }
    public get length(): number {
        return window.localStorage.length;
    }
    key(index: number): string | null {
        return window.localStorage.key(index);
    }
    getItem(key: string): string | null {
        return window.localStorage.getItem(this.fixKey(key));
    }
    setItem(key: string, value: string): void {
        window.localStorage.setItem(this.fixKey(key), value);
    }
    removeItem(key: string): void {
        window.localStorage.removeItem(this.fixKey(key));
    }
    clear(): void {
        window.localStorage.clear();
    }
}

class CookieStore extends BaseStore implements IStorage {
    private _cookieStore: Record<string, string> = {};
    public get length(): number {
        if (!Utils.isGood(this._cookieStore) || Object.keys(this._cookieStore).length === 0) this.loadCookies();
        return Object.keys(this._cookieStore).length;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_type: StoreType = 'cookie', prefix: string) {
        super(_type, prefix);
        this.loadCookies();
    }
    private loadCookies() {
        const cookie = document.cookie;
        const allCookies = cookie.split(';').map(s => s.trim()).filter(kv => kv.startsWith(this.prefix));
        const allKeysAndValues = allCookies.map(kv => kv.split('='));
        const cookieStore = Object.fromEntries(allKeysAndValues);
        this._cookieStore = cookieStore;
    }
    private saveCookies() {
        const cookie = document.cookie;
        const allCookies = cookie.split(';').map(s => s.trim()).filter(kv => kv.startsWith(this.prefix));
        const allCookieKeysAndValues = allCookies.map(kv => kv.split('='));
        const allSavedKeysAndValues = Object.entries(this._cookieStore);
        // expire all existing keys and values
        for (let i = 0; i < allCookieKeysAndValues.length; i = i + 1) {
            document.cookie = `${allCookieKeysAndValues[i][0]}=${allCookieKeysAndValues[i][1]};max-age=0`;
        }
        // add new keys and values
        for (let i = 0; i < allSavedKeysAndValues.length; i = i + 1) {
            document.cookie = `${allSavedKeysAndValues[i][0]}=${allSavedKeysAndValues[i][1]};max-age=31536000`;
        }
    }
    key(index: number): string {
        if (this.length === 0) this.loadCookies();
        return Object.keys(this._cookieStore)[index];
    }
    getItem(key: string): string {
        if (this.length === 0) this.loadCookies();
        return this._cookieStore[this.fixKey(key)]
    }
    setItem(key: string, value: string): void {
        if (this.length === 0) this.loadCookies();
        this._cookieStore[this.fixKey(key)] = value;

        this.saveCookies();
    }
    removeItem(key: string): void {
        if (this.length === 0) this.loadCookies();
        delete this._cookieStore[this.fixKey(key)];

        this.saveCookies();
    }
    clear(): void {
        if (this.length === 0) this.loadCookies();
        this.saveCookies();
    }
}
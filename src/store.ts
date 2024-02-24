import { hashAny } from "./hash";

type SubFunction = (value: any, ref?: string)=> void;

type StoreOptions<T> = {
    value?: T, name?: string, 
    upstream?: Array<string>, 
    updater?: (upstreamValues?: Array<any>, curVal?: T) => T, 
};

export class Store<T> {
    //State
    name?: string;
    value: T | undefined = undefined;
    #updater?: (upstreamValues: Array<any>, curVal?: T) => T;
    #subscriptions: Map<string, SubFunction> = new Map();
    #storedHash?: string;

    //Derivation
    #downstreamStores: Array<string> = [];
    #upstreamStores: Array<string> = [];

    //Static
    static #hash = hashAny;
    static #stores: Map<string, Store<any>> = new Map();
    static #funcs: Map<string, Function> = new Map();

    //Constructor
    constructor(ops: StoreOptions<T>) {
        return this.modify(ops);
    }

    /*
     * INSTANCE METHODS
     */
    addDep(store?: string) {
        if(store) this.#downstreamStores?.push(store);
    }

    addSub(ref: string, sub: (value: T)=> void) {
        this.#subscriptions.set(ref, sub);
        sub?.(this.value as T);
    }

    //Modify store
    modify(ops: StoreOptions<T>) {
        this.#upstreamStores = ops?.upstream || [];
        for(let store of this.#upstreamStores || []) Store.box(store)?.addDep(this.name);

        if(ops?.name) {
            this.name = ops.name;
            Store.#stores.set(ops.name, this);
        }
        this.value = ops?.value;
        this.#updater = ops?.updater;
        return this;
    }

    //Manual update
    async update(value: T | ((curVal: T)=> T)) {
        if(typeof value == "function") this.value = (value as Function)?.(this.value);
        else this.value = value;
        
        let newHash = Store.#hash(this.value);
        if(newHash !== this.#storedHash) {
            this.#storedHash = newHash;
            this.#updateDependents();
        }
    }

    //Auto update
    async _reset() {
        this.update(
            await (this.#updater?.(
                this.#upstreamStores?.map(store => Store.box(store)?.value) || [], 
                this?.value
            ) || this.value) as T
        )
    }

    //Sync changes to downstream stores
    async #updateDependents() {
        for(let store of this.#downstreamStores) Store.box(store)?._reset();

        for(let [ref, sub] of this.#subscriptions) {
            sub?.(this.value as T, ref);
        }
    }

    static box<U>(name: string, ops?: StoreOptions<U>): Store<U> {
        const store = Store.#stores.get(name);
        if(ops) return store?.modify(ops) || new Store({...ops, name});
        return store || new Store({name})
    }

    static func(name: string) {
        return Store.#funcs.get(name);
    }

    static assignFuncs(funcs: {[key: string]: Function}) {
        for(let key in funcs) Store.#funcs.set(key, funcs[key]);
    }

    static changeHash = (hash: (value: any)=> string) => Store.#hash = hash;
}

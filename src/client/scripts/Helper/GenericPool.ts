export class GenericPool<T>
{
    private _pool: T[] = [];
    private _factory: () => T;

    private _reserveCount = 0;
    private _releaseCount = 0;

    constructor(initialSize: number, factory: () => T)
    {
        this._factory = factory;
        for(let index = 0; index < initialSize; ++index)
        {
            this._pool.push(this._factory());
        }
    }

    public reserve(): T
    {
        this._reserveCount++;
        if(this._pool.length > 0)
            return this._pool.pop() as T;
        return this._factory();
    }

    public release(obj: T)
    {
        this._pool.push(obj);
        this._releaseCount++;
    }

    public getPoolSize()
    {
        return this._pool.length;
    }

    public preallocate(count: number)
    {
        for (let i = 0; i < count; i++)
        {
            this._pool.push(this._factory());
        }
    }

    public resetStats()
    {
        this._releaseCount = 0;
        this._reserveCount = 0;
    }

    public printStats()
    {
        if(this._releaseCount != this._reserveCount)
            console.log("Reserved: ", this._reserveCount, "; Released: ", this._releaseCount);
    }
}
export type ConnectionCallback<T extends unknown[]> = (...Args: T) => void;

export class Connection {
    public Connected = true;

    constructor(
        private Callback: () => void
    ) {}

    public Disconnect(): void {
        if (!this.Connected) return;

        this.Connected = false;
        this.Callback();
    }
}

export class Signal<T extends unknown[] = []> {
    private Connections: {
        Connection: Connection;
        Callback: ConnectionCallback<T>;
    }[] = [];

    private Destroyed = false;

    public Connect(
        Callback: ConnectionCallback<T>
    ): Connection {
        if (this.Destroyed) {
            throw new Error("Cannot connect to a destroyed signal.");
        }

        let ConnectionObject!: Connection;

        ConnectionObject = new Connection(() => {
            this.Connections = this.Connections.filter(
                Item => Item.Connection !== ConnectionObject
            );
        });

        this.Connections.push({
            Connection: ConnectionObject,
            Callback
        });

        return ConnectionObject;
    }

    public Once(
        Callback: ConnectionCallback<T>
    ): Connection {
        let ConnectionObject!: Connection;

        ConnectionObject = this.Connect((...Args) => {
            ConnectionObject.Disconnect();
            Callback(...Args);
        });

        return ConnectionObject;
    }

    public Wait(): Promise<T> {
        return new Promise(resolve => {
            this.Once((...Args) => resolve(Args));
        });
    }

    public Fire(...Args: T): void {
        if (this.Destroyed) return;

        for (const Item of [...this.Connections]) {
            if (!Item.Connection.Connected) continue;

            try {
                Item.Callback(...Args);
            } catch (Error) {
                // One failing subscriber must not stop the others or the frame loop.
                console.error("Signal callback failed:", Error);
            }
        }
    }

    public DisconnectAll(): void {
        for (const Item of [...this.Connections]) {
            Item.Connection.Disconnect();
        }
    }

    public Destroy(): void {
        if (this.Destroyed) return;

        this.DisconnectAll();
        this.Destroyed = true;
    }
}

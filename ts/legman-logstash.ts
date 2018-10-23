import Legman from "legman";
import { Socket } from "net";
import { Writable } from "stream";

const NEWLINE = "\n";
const reconnectOn = ["ECONNREFUSED", "ECONNRESET", "ENOTFOUND"];

export class LegmanLogstash extends Writable {
    public reconnectDelay = 1000;
    public connectionTimeout = 5000;
    public reconnectFactor = 2;
    public autoReconnect = true;
    public connected: boolean = false;
    private socket: Socket = new Socket();

    private reconnecting?: Promise<Socket>;
    private currentReconnectDelay = 1000; // reconnectDelay

    constructor(private port: number, private host?: string) {
        super({ objectMode: true });
    }

    public connect(): Promise<Socket> {
        if (this.connected) {
            return Promise.resolve(this.socket);
        }
        if (!this.socket || this.socket.destroyed) {
            this.createSocket();
        }
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (!this.connected) {
                    reject(new Error("Connection timeout"));
                }
            }, this.connectionTimeout);
            if (this.host) {
                return this.socket.connect(this.port, this.host, () => resolve());
            }
            return this.socket.connect(this.port, () => resolve());
        }).then(() => {
            this.connected = true;
            this.emit("connected");
            return this.socket;
        });
    }
    public close(): Promise<void> {
        return new Promise((resolve) => {
            this.autoReconnect = false;
            this.socket.once("close", () => resolve());
            this.socket.destroy();
        });
    }

    public _write(chunk: any, encoding: string, callback: (error?: Error | null) => void): void {
        const write = (): void => {
            try {
                if (!this.connected || this.socket.destroyed) {
                    this.connected = false;
                    this.reconnect();
                    return void this.once("connected", () => write());
                }
                this.socket.write(JSON.stringify({...chunk, timestamp: chunk[Legman.timestampSymbol]}) + NEWLINE);
                callback();
            } catch (err) {
                // tslint:disable-next-line
                console.error("Error while transportation to Logstash:", err);
                callback(err);
            }
        };

        process.nextTick(() => write());
    }

    private createSocket() {
        this.socket = new Socket();
        this.socket.on("error", (err: Error & {code: string}) => {
            if (this.autoReconnect && reconnectOn.includes(err.code)) {
                this.connected = false;
                this.emit("disconnected");
                return this.reconnect(true); // TODO: this is the important part
            }
            this.emit("error", err);
        });
    }

    private reconnect(force = false): Promise<Socket> {
        if (this.reconnecting && !force) {
            return this.reconnecting;
        }

        this.createSocket();
        this.reconnecting = sleep(this.currentReconnectDelay)
            .then(() => this.connect())
            .then(() => {
                this.currentReconnectDelay = this.reconnectDelay;
            })
            .catch(() => this.reconnect())
            .then(() => this.reconnecting = undefined)
            .then(() => this.socket);
        this.currentReconnectDelay *= this.reconnectFactor;

        // tslint:disable-next-line
        console.warn(`Trying to reconnect to Logstash in ${ this.currentReconnectDelay / 1000 }s`);
        return this.reconnecting;
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

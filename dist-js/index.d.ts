/**
 * Configuration used to open a WebSocket connection, forwarded to the underlying `tungstenite` client.
 */
export interface ConnectionConfig {
    /**
     * Read buffer capacity. The default value is 128 KiB.
     */
    readBufferSize?: number;
    /** The target minimum size of the write buffer to reach before writing the data to the underlying stream. The default value is 128 KiB.
     *
     * If set to 0 each message will be eagerly written to the underlying stream. It is often more optimal to allow them to buffer a little, hence the default value.
     */
    writeBufferSize?: number;
    /** The max size of the write buffer in bytes. Setting this can provide backpressure in the case the write buffer is filling up due to write errors. The default value is unlimited.
     *
     * Note: The write buffer only builds up past write_buffer_size when writes to the underlying stream are failing. So the write buffer can not fill up if you are not observing write errors.
     *
     * Note: Should always be at least write_buffer_size + 1 message and probably a little more depending on error handling strategy.
     */
    maxWriteBufferSize?: number;
    /**
     * The maximum size of an incoming message. The string "none" means no size limit. The default value is 64 MiB which should be reasonably big for all normal use-cases but small enough to prevent memory eating by a malicious user.
     */
    maxMessageSize?: number | 'none';
    /**
     * The maximum size of a single incoming message frame. The string "none" means no size limit. The limit is for frame payload NOT including the frame header. The default value is 16 MiB which should be reasonably big for all normal use-cases but small enough to prevent memory eating by a malicious user.
     */
    maxFrameSize?: number | 'none';
    /**
     * When set to true, the server will accept and handle unmasked frames from the client. According to the RFC 6455, the server must close the connection to the client in such cases, however it seems like there are some popular libraries that are sending unmasked frames, ignoring the RFC. By default this option is set to false, i.e. according to RFC 6455.
     */
    acceptUnmaskedFrames?: boolean;
    /**
     * Additional connect request headers.
     */
    headers?: HeadersInit;
}
/**
 * A tagged WebSocket message, discriminated by its `type` field.
 */
export interface MessageKind<T, D> {
    /** The kind of message, e.g. `'Text'`, `'Binary'`, `'Ping'`, `'Pong'` or `'Close'`. */
    type: T;
    /** The message payload, whose shape depends on {@link MessageKind.type}. */
    data: D;
}
/**
 * The code and reason sent (or received) when a WebSocket connection is closed.
 */
export interface CloseFrame {
    /** The WebSocket close status code, e.g. `1000` for a normal closure. */
    code: number;
    /** A human-readable explanation for why the connection was closed. */
    reason: string;
}
/**
 * A message sent to or received from a WebSocket connection.
 */
export type Message = MessageKind<'Text', string> | MessageKind<'Binary', number[]> | MessageKind<'Ping', number[]> | MessageKind<'Pong', number[]> | MessageKind<'Close', CloseFrame | null>;
/**
 * A WebSocket connection, created with {@link WebSocket.connect}.
 *
 * @since 2.0.0
 */
export default class WebSocket {
    /** The identifier of the underlying connection managed by the Rust side. */
    id: number;
    private readonly listeners;
    /**
     * Creates a {@link WebSocket} wrapper around an already-open connection.
     *
     * This is used internally by {@link WebSocket.connect}; use that instead of calling this
     * constructor directly.
     *
     * @param id The identifier of the connection returned by the Rust side.
     * @param listeners The set of callbacks to notify when a message is received.
     * @example
     * ```typescript
     * import WebSocket from '@tauri-apps/plugin-websocket';
     *
     * // internally used by `WebSocket.connect`; prefer calling that instead
     * const ws = await WebSocket.connect('wss://example.com');
     * ```
     */
    constructor(id: number, listeners: Set<(arg: Message) => void>);
    /**
     * Opens a WebSocket connection to the given URL.
     * @example
     * ```typescript
     * import WebSocket from '@tauri-apps/plugin-websocket';
     *
     * const ws = await WebSocket.connect('wss://example.com');
     * ```
     *
     * @param url The URL to connect to, e.g. `ws://` or `wss://` (the latter requires one of the
     * plugin's TLS Cargo features to be enabled).
     * @param config Configuration forwarded to the underlying `tungstenite` client.
     * @returns A promise resolving to the connected {@link WebSocket}.
     * @since 2.0.0
     */
    static connect(url: string, config?: ConnectionConfig): Promise<WebSocket>;
    /**
     * Adds a listener that is called whenever a message is received on this connection, including
     * an error message (as a `'Close'` message) when the underlying stream fails.
     * @example
     * ```typescript
     * import WebSocket from '@tauri-apps/plugin-websocket';
     *
     * const ws = await WebSocket.connect('wss://example.com');
     * const unlisten = ws.addListener((message) => console.log(message));
     * ```
     *
     * @param cb The callback invoked with each received {@link Message}.
     * @returns A function that removes the listener when called.
     */
    addListener(cb: (arg: Message) => void): () => void;
    /**
     * Sends a message through the WebSocket connection.
     * @example
     * ```typescript
     * import WebSocket from '@tauri-apps/plugin-websocket';
     *
     * const ws = await WebSocket.connect('wss://example.com');
     * await ws.send('Hello World');
     * await ws.send([1, 2, 3]);
     * await ws.send({ type: 'Text', data: 'Hello World' });
     * ```
     *
     * @param message The message to send: a plain string (sent as a `'Text'` message), a numeric
     * array (sent as a `'Binary'` message), or an explicit {@link Message} object.
     * @returns A promise resolving when the message has been sent.
     */
    send(message: Message | string | number[]): Promise<void>;
    /**
     * Closes the WebSocket connection, sending a normal closure (`1000`) close frame to the server.
     * @example
     * ```typescript
     * import WebSocket from '@tauri-apps/plugin-websocket';
     *
     * const ws = await WebSocket.connect('wss://example.com');
     * await ws.disconnect();
     * ```
     */
    disconnect(): Promise<void>;
}

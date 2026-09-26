'use strict';

var core = require('@tauri-apps/api/core');

// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT
/**
 * Open a WebSocket connection using a Rust client in JS.
 *
 * @module
 */
/**
 * A WebSocket connection, created with {@link WebSocket.connect}.
 *
 * @since 2.0.0
 */
class WebSocket {
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
    constructor(id, listeners) {
        this.id = id;
        this.listeners = listeners;
    }
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
    static async connect(url, config) {
        const listeners = new Set();
        const onMessage = new core.Channel();
        onMessage.onmessage = (message) => {
            listeners.forEach((l) => {
                l(message);
            });
        };
        if (config?.headers) {
            config.headers = Array.from(new Headers(config.headers).entries());
        }
        return await core.invoke('plugin:websocket|connect', {
            url,
            onMessage,
            config
        }).then((id) => new WebSocket(id, listeners));
    }
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
    addListener(cb) {
        this.listeners.add(cb);
        return () => {
            this.listeners.delete(cb);
        };
    }
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
    async send(message) {
        let m;
        if (typeof message === 'string') {
            m = { type: 'Text', data: message };
        }
        else if (typeof message === 'object' && 'type' in message) {
            m = message;
        }
        else if (Array.isArray(message)) {
            m = { type: 'Binary', data: message };
        }
        else {
            throw new Error('invalid `message` type, expected a `{ type: string, data: any }` object, a string or a numeric array');
        }
        await core.invoke('plugin:websocket|send', {
            id: this.id,
            message: m
        });
    }
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
    async disconnect() {
        await this.send({
            type: 'Close',
            data: {
                code: 1000,
                reason: 'Disconnected by client'
            }
        });
    }
}

module.exports = WebSocket;

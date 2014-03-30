function EventEmitter() {
    this.listeners = null;
}

EventEmitter.prototype = {
    on: function (event, listener, context) {
        var info = { listener: listener, context: context };
        if (!this.listeners) this.listeners = {};

        if (!this.listeners[event]) {
            this.listeners[event] = [info];
        } else {
            this.listeners[event].push(info);
        }
        return this;
    },
    once: function (event, listener, context) {
        function realListener() {
            listener.apply(context, arguments);
            this.off(event, realListener);
        }
        this.on(event, realListener, this);
        return this;
    },
    off: function (event, listener) {
        if (this.listeners && this.listeners[event]) {
            var listeners = this.listeners[event];
            for (var i = 0, ii = listeners.length; i < ii; i++) {
                if (listeners[i].listener === listener) {
                    listeners.splice(i, 1);
                    break;
                }
            }
        }
        return this;
    },
    removeAllListeners: function (event) { /* [event] */
        if (ot.isUndefined(event)) {
            this.listeners = null;
        } else if (this.listeners && this.listeners[event]) {
            this.listeners[event] = null;
        }
        return this;
    },
    emit: function (event) {
        if (this.listeners && this.listeners[event]) {
            var listeners = this.listeners[event], args = ot.toArray(arguments).slice(1);
            ot.forEach(listeners, function (listenerInfo) {
                listenerInfo.listener.apply(listenerInfo.context, args);
            });
        }
        return this;
    }
};

EventEmitter.prototype.addListener = EventEmitter.prototype.on;
EventEmitter.prototype.removeListener = EventEmitter.prototype.off;
EventEmitter.prototype.trigger = EventEmitter.prototype.emit;
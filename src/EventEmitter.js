function EventEmitter() {
    this.listeners = null;
}

EventEmitter.prototype = {
    on: function (event, listener, context) {
        if (ot.isObject(event)) {
            context = listener;
            listener = event;
            ot.forEach(listener, function (listener, event) {
                this.on(event, listener, context);
            }, this);
            return;
        }
        var info = { listener: listener, context: context || this };
        if (!this.listeners) this.listeners = {};
        if (!this.listeners[event]) this.listeners[event] = [];

        this.listeners[event].push(info);
        return this;
    },
    once: function (event, listener, context) {
        context = context || this;
        function onceListener() {
            listener.apply(context, arguments);
            this.off(event, onceListener);
        }
        this.on(event, onceListener, this);
        return this;
    },
    off: function (event, listener) {
        if (this.listeners && this.listeners[event]) {
            var listeners = this.listeners[event];
            for (var i = listeners.length-1; i >= 0; i--) {
                if (listeners[i].listener === listener) {
                    listeners.splice(i, 1);
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
    emit: function (event, args) {
        if (this.listeners && this.listeners[event]) {
            var listeners = this.listeners[event];
            // we slice in case the listener array gets changed while looping
            ot.forEach(listeners.slice(), function (listenerInfo) {
                listenerInfo.listener.apply(listenerInfo.context, args);
            });
        }
        return this;
    }
};

EventEmitter.prototype.addListener = EventEmitter.prototype.on;
EventEmitter.prototype.removeListener = EventEmitter.prototype.off;
EventEmitter.prototype.trigger = EventEmitter.prototype.emit;
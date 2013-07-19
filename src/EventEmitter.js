function EventEmitter() {
    this.listeners = null;
}

EventEmitter.prototype = {
    addListener: function (event, listener, context) {
        var info = { listener: listener, context: context };
        if (!this.listeners) this.listeners = {};

        if (!this.listeners[event]) {
            this.listeners[event] = [info];
        } else {
            this.listeners[event].push(info);
        }

    },
    once: function (event, listener, context) {
        this.addListener(event, function () {
            listener.apply(context, arguments);
            this.removeListener(event, listener);
        }, this);
    },
    removeListener: function (event, listener) {
        if (this.listeners && this.listeners[event]) {
            var listeners = this.listeners[event];
            for (var i = 0, ii = listeners.length; i < ii; i++) {
                if (listeners[i].listener === listener) {
                    listeners.splice(i, 1);
                    break;
                }
            }
        }
    },
    removeAllListeners: function (event) { /* [event] */
        if (ot.isUndefined(event)) {
            this.listeners = null;
        } else if (this.listeners && this.listeners[event]) {
            this.listeners[event] = null;
        }
    },
    emit: function (event) {
        if (this.listeners && this.listeners[event]) {
            var listeners = this.listeners[event], args = ot.toArray(arguments).slice(1);
            ot.forEach(listeners, function (listenerInfo) {
                listenerInfo.listener.apply(listenerInfo.context, args);
            });
        }
    }
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.trigger = EventEmitter.prototype.emit;
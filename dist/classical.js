/*! ClassicalJS v0.0.0 23-07-2013 
Copyright (c) 2013 rodyhaddad

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*! objectTools.js v0.7.0 19-07-2013 
The MIT License (MIT)

Copyright (c) 2013 rodyhaddad

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var ot = (function () {

/**
 * The global object. `window` in the browser, `global` in node.js or `this` otherwise
 *
 * @type {window|global|*}
 */
var globalObj = typeof window !== "undefined" ? window :
    (typeof global !== "undefined" ? global :
        this);

/**
 * Determine whether the argument is an array or not
 *
 * @param arr Variable to test on
 * @returns {boolean} Whether the argument is an array or not
 */
function isArray(arr) {
    return Object.prototype.toString.call(arr) === "[object Array]";
}

/**
 * Determine whether the argument is an object or not (excludes null)
 *
 * @param obj Variable to test on
 * @returns {boolean} Whether the argument is an object or not (excludes null)
 */
function isObject(obj) {
    return typeof obj === "object" && obj !== null;
}

/**
 * Determine whether the argument is a function or not
 *
 * @param fn Variable to test on
 * @returns {boolean} Whether the argument is a function or not
 */
function isFn(fn) {
    return typeof fn === "function";
}

/**
 * Determine whether the argument is undefined or not
 *
 * @param val Variable to test on
 * @returns {boolean} Whether the argument is undefined or not
 */
function isUndefined(val) {
    return typeof val === "undefined";
}

/**
 * Determine whether the argument is empty or not
 *
 * @param {Object} obj Object to test on
 * @returns {boolean} Whether the object is empty
 */
function isEmptyObject(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}

/**
 * Transforms the argument into an array. Useful for transmuting the arguments object
 *
 * @param obj the argument to transform into an array
 * @returns {Array} An array originating from the argument
 */
function toArray(obj) {
    return Array.prototype.slice.call(obj, 0);
}

/**
 * Cleans an array from a specific element
 *
 * @param array An array to clean
 * @param from What should be removed from the array
 * @returns {Array} The cleaned array
 */
function cleanArray(array, from) {
    for (var i = array.length - 1; i >= 0; i--) {
        if (array[i] === from) {
            array.splice(i, 1);
        }
    }
    return array;
}

/**
 * A function that performs no operations
 */
function noop() {

}

/**
 * If the value of the named property is a function then invoke it with the object as context.
 * Otherwise, return it.
 *
 * @param {Object} object The object to act on
 * @param {String} property The property to return
 * @param {Array} args The arguments passed to the value if it's a function
 * @returns {*} the result
 */
function result(object, property, args) {
    if (object) {
        var value = object[property];
        return isFn(value) ? value.apply(object, args) : value;
    }
}

/**
 * Invokes the `iterator` function once for each item in `obj` collection, which can be either an object or an array.
 * the `iterator` function is invoked with iterator(value, key|index), with it's `this` being the `context`
 *
 * @param {Object|Array} obj Object to iterate over
 * @param {Function} iterator Iterator function
 * @param {*} [context] The context (`this`) for the iterator function
 * @returns {*} The obj passed in
 */
function forEach(obj, iterator, context) {
    var key, len;
    if (obj) {
        if (isFn(obj)) {
            for (key in obj) {
                if (obj.hasOwnProperty(key) && key != "prototype" && key != "length" && key != "name") {
                    iterator.call(context, obj[key], key);
                }
            }
        } else if (isArray(obj) || obj.hasOwnProperty("length")) {
            for (key = 0, len = obj.length; key < len; key++) {
                iterator.call(context, obj[key], key);
            }
        } else if (obj.forEach && obj.forEach !== forEach) {
            obj.forEach(iterator, context);
        } else {
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    iterator.call(context, obj[key], key);
                }
            }
        }
    }
    return obj;
}

var _inherit = Object.create || (function () {
    function F() {
    }

    return function (o) {
        F.prototype = o;
        return new F();
    };
})();

/**
 * Makes an object that inherits `obj`. Similar to Object.create
 *
 * @param obj {Object} The object to inherit
 * @param [mergeObj] {Object} An object that will be merged with the resulting child object
 * @returns {Object} The resulting object
 */
function inherit(obj, mergeObj) {
    var inheritObj = _inherit(obj);

    return mergeObj ? merge(inheritObj, mergeObj) : inheritObj;
}

/**
 * Makes an object that recursively inherits `obj`.
 *
 * @param obj {Object} The object to recursively inherit
 * @param [mergeObj] {Object} An object that will be recursively merged with the resulting child object
 * @param {Function} fnEachLevel A function that gets called on each level of inherited object
 * @returns {Object} The resulting object
 */
function deepInherit(obj, mergeObj, fnEachLevel, _level) {
    var inheritObj;
    if (isFn(obj)) {
        inheritObj = function () {
            return obj.apply(this, toArray(arguments));
        };
    } else {
        inheritObj = inherit(obj);
    }

    if (fnEachLevel) {
        _level = _level || 0;
        fnEachLevel(inheritObj, obj, _level);
    }

    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (( isFn(obj[key]) || isObject(obj[key]) ) && globalObj !== obj[key] && !isArray(obj[key])) {
                inheritObj[key] = deepInherit(obj[key], null, fnEachLevel, _level + 1);
            }
        }
    }
    return mergeObj ? deepMerge(inheritObj, mergeObj) : inheritObj;
}

/**
 * Makes an object that recursively inherits `obj`.
 *
 * @param obj {Object} The object to bound inherit
 * @param [mergeObj] {Object} An object that will be recursively merged with the resulting child object
 * @param {Function} fnEachLevel A function that gets called on each level of inherited object
 * @returns {Object} The resulting object
 */
function boundInherit(obj, mergeObj, fnEachLevel) {
    return deepInherit(obj, mergeObj, function (obj, superObj, level) {
        if (!isArray(superObj.$$boundChildren)) {
            superObj.$$boundChildren = [];
        }
        superObj.$$boundChildren.push(obj);

        if (fnEachLevel) {
            fnEachLevel(obj, superObj, level);
        }

    });
}

/**
 * Merges the `destination` and the `source` objects
 * by copying all of the properties from the source object to the destination object.
 *
 * @param {Object} destination Destination Object
 * @param {Object} source Source Object
 * @returns {Object} The mutated `destination` Object
 */
function merge(destination, source) {
    if(destination && source) {
        for(var key in source) {
            if(source.hasOwnProperty(key)) {
                destination[key] = source[key];
            }
        }
    }
    return destination;
}

/**
 * Recursively/Deeply merges the `destination` and the `source` objects
 * by copying all of the properties from the source object to the destination object.
 *
 * @param {Object} destination Destination Object
 * @param {Object} source Source Object
 * @returns {Object} The mutated `destination` Object
 */
function deepMerge(destination, source) {
    if(destination && source) {
        for(var key in source) {
            if(source.hasOwnProperty(key)) {
                if(isObject(source[key]) && isObject(destination[key])) {
                    deepMerge(destination[key], source[key]);
                } else {
                    destination[key] = source[key];
                }
            }
        }
    }
    return destination;
}

/**
 * Softly deeply merges the `destination` and the `source` objects
 * by copying all of the properties from the source object that do not exist on the destination object.
 *
 * @param {Object} destination Destination Object
 * @param {Object} source Source Object
 * @returns {Object} The mutated `destination` Object
 */
function softMerge(destination, source) {
    if(destination && source) {
        for(var key in source) {
            if(source.hasOwnProperty(key)) {
                if(isObject(source[key]) && isObject(destination[key])) {
                    softMerge(destination[key], source[key]);
                } else if(isUndefined(destination[key])) {
                    destination[key] = source[key];
                }
            }
        }
    }
    return destination;
}

/**
 * Allows you to navigate an object with a given `road`.
 * The given `fn` is invoked with fn(value, key, roadIndex, road) with the context (`this`) being the step in the road
 * you're in.
 * If `fn` returns false, the navigation stops
 *
 * @param {Object} obj The object to navigate
 * @param {Array|String} road Either an array of property names or a String of dot separated property names
 * @param {Function} fn A function that will be called for every property name with the args (value, key, index, roadArray) and its this scope being the current step in the road
 * @returns {*} `null` if navigation was interrupted, or the last step in the road
 */
function navigate(obj, road, fn) {
    if (typeof road === "string") {
        road = cleanArray(road.split("."));
    }
    for (var i = 0; i < road.length; i++) {
        if (isUndefined(obj) || fn.call(obj, obj[road[i]], road[i], i, road) === false) {
            return null;
        }
        obj = obj[road[i]];
    }

    return obj;
}

/**
 * Allows you to check if all properties on a road are owned by a specific Object
 *
 * @param {Object} obj The object to navigate
 * @param {Array|String} road Either an array of property names or a String of dot separated property names
 * @returns {boolean} Whether all properties in the road are owned by `obj`
 */
navigate.hasOwn = function (obj, road) {
    var hasOwn = true;
    navigate(obj, road, function (value, key) {
        hasOwn = this.hasOwnProperty(key);
        return hasOwn;
    });
    return hasOwn;
};

// handle the completion of the road for navigate.set
var completeRoad = {
    'undefined': function (value, key) {
        this[key] = {};
    },
    'object': function (value, key, setOwn) {
        if (setOwn && !this.hasOwnProperty(key)) {
            this[key] = inherit(this[key]);
        }
    },
    'function': noop,
    'null': function (value, key) {
        this[key] = {
            valueOf: function () {
                return value;
            }
        };
    }
    //string, boolean, number = null
};
completeRoad.string = completeRoad.boolean = completeRoad.number = completeRoad['null'];
navigate._completeRoad = completeRoad;

/**
 * Navigate `obj` on the `road` and sets `endValue` on the end of the `road`
 *
 * @param {Object} obj The object to navigate
 * @param {Array|String} road Either an array of property names or a String of dot separated property names
 * @param {*} endValue The value to set on the end of the road
 * @param {boolean} setOwn If true, it makes sure that the navigation never travels in an inherited Object
 * @returns {*} The `endValue`
 */
navigate.set = function (obj, road, endValue, setOwn) {
    navigate(obj, road, function (value, key, i, road) {
        if (i === road.length - 1) {
            if (isObject(value)) {
                if (isObject(endValue) || isFn(endValue)) {
                    this[key] = endValue;
                    merge(this[key], value);
                } else {
                    this[key].valueOf = function () {
                        return endValue;
                    };
                }
            } else {
                this[key] = endValue;
            }
        } else {
            var typeofValue = (value !== null ? typeof value : "null");
            completeRoad[typeofValue].call(this, value, key, setOwn, value, i, road);
        }

        if (this.$$boundChildren && isObject(this[key])) {
            forEach(this.$$boundChildren, function (child) {
                if (!child.hasOwnProperty(key)){
                    child[key] = boundInherit(this[key]);
                }
            }, this);
        }
    });
    return endValue;
};

/**
 * Navigate `obj` on the `road` and sets `endValue` on the end of the `road`,
 * making sure it never travels in an inherited Object
 *
 * @param {Object} obj The object to navigate
 * @param {Array|String} road Either an array of property names or a String of dot separated property names
 * @param {*} endValue The value to set on the end of the road
 * @returns {*} The `endValue`
 */
navigate.setOwn = function (obj, road, endValue) {
    return navigate.set(obj, road, endValue, true);
};

/**
 * Navigate `obj` on the `road` and returns the value at the end of the `road`
 *
 * @param {Object} obj The object to navigate
 * @param {Array|String} road Either an array of property names or a String of dot separated property names
 * @returns {*} The value at the end of the road
 */
navigate.get = function (obj, road) {
    var endValue = null;

    navigate(obj, road, function (value, key, i, road) {
        if (i === road.length - 1) {
            endValue = value;
        }
    });

    return endValue && endValue.valueOf();
};

var ot = {
    globalObj: globalObj,
    isArray: isArray,
    isObject: isObject,
    isFn: isFn,
    isUndefined: isUndefined,
    isEmptyObject: isEmptyObject,
    toArray: toArray,
    cleanArray: cleanArray,
    noop: noop,
    result: result,

    forEach: forEach,

    merge: merge,
    deepMerge: deepMerge, mergeRecursively: deepMerge, recursiveMerge: deepMerge,
    softMerge: softMerge, mergeSoftly: softMerge,

    inherit: inherit,
    deepInherit: deepInherit, recursiveInherit: deepInherit, inheritRecursively: deepInherit,
    boundInherit: boundInherit,

    navigate: navigate
};

if (typeof module === "object" && module && isObject(module.exports)) {
    module.exports = ot;
} else {
    if (typeof define === "function" && define.amd) {
        define("ot", [], function(){
            return ot;
        });
    }
}

    return ot;
}());

var baseConfig = {
    constructorName: "init",
    defaultMethod: "Public",
    superName: "$Super"
};

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

function BaseClass(args) {
    args = args.isParams ? args : ot.toArray(arguments);
    if (!(this instanceof BaseClass)) {
        args.isParams = true;
        return new BaseClass(args);
    }

    var $Class = this.$Class = this;
    this.$ClassDefiner = BaseClass;

    ot.forEach(BaseClass.toInherit, function (value, key) {
        this[key] = ot.recursiveInherit(value, null, function (obj) {
            obj.$Class = $Class;
        });
    }, this);

    this.params = this.handleParams(args);
    this.name = this.params.name || "Anonymous";
    this.components = [];

    this.classConstructor = this.createClassConstructor();

    this.ClassPluginsFirst = new PluginList(null, this);
    this.ClassPluginsLast = new PluginList(null, this);
    this.queuedComponentPlugins = new PluginList(false, this);

    addExport(this.classConstructor, this.$ClassDefiner);
    addExport(window, this.$ClassDefiner);
    if (this.params.definition) {
        this.params.definition.call(this.classConstructor);
        this.End();
    }

    return this.classConstructor;
}
ot.merge(BaseClass, {
    valuesToExport: {
        Config: exportClassFn("Config"),
        End: exportClassFn("End")
    },
    config: baseConfig,
    toInherit: {
        config: baseConfig
    },
    Config: function (config) {
        ot.deepMerge(this.config, config);
    }
});

BaseClass.prototype = {
    Config: BaseClass.Config,
    End: function () {
        removeExport(this.classConstructor, this.$ClassDefiner);
        removeExport(window, this.$ClassDefiner);
        var infoArgs = [
            {
                $Class: this.$Class
            }
        ];

        this.ClassPluginsFirst.execute("onDefinition", infoArgs);
        ot.forEach(this.components, function (component) {
            component.pluginList.execute("onDefinition", [
                ot.inherit(infoArgs[0], {
                    component: component
                })
            ]);
        });
        this.ClassPluginsLast.execute("onDefinition", infoArgs);
    },
    addComponent: function (component) {
        this.components.push(component);
    },
    createClassConstructor: function () {
        /*jshint evil:true */
        var classConstructor = new Function("$Class", "toArray",
            "" +
                "function " + this.name + "(){ " +
                "    if(this instanceof " + this.name + ") {" +
                "        return $Class.onClassConstructorCall(this, toArray(arguments)); " +
                "    } else {" +
                "        return $Class.onClassFunctionCall(toArray(arguments))" +
                "    }" +
                "} " +
                "return " + this.name + ";")(this, ot.toArray);

        classConstructor.$Class = this;
        classConstructor.prototype.$Class = this;
        return classConstructor;
    },
    onClassConstructorCall: function (instance, args) {
        var infoArgs = [
            {
                $Class: this.$Class,
                instance: instance
            }
        ];

        this.ClassPluginsFirst.execute("onInstanceCreation", infoArgs);
        ot.forEach(this.components, function (component) {
            component.pluginList.execute("onInstanceCreation", [
                ot.inherit(infoArgs[0], {
                    component: component
                })
            ]);
        });
        this.ClassPluginsLast.execute("onInstanceCreation", infoArgs);
    },
    onClassFunctionCall: function (args) {

    }
};

function Component($Class, mainPlugin, details) {
    EventEmitter.call(this);
    this.mainPlugin = mainPlugin;
    this.$Class = $Class;
    this.pluginList = new PluginList(this, $Class);
    this.details = details || {};
}

Component.prototype = ot.inherit(EventEmitter.prototype, {
    set: function(name, value) {
        var oldValue = this.details[name];
        this.details[name] = value;

        this.emit("change:" + name, value, oldValue, this);
        this.emit("change", value, oldValue, this);
    }
});

function Plugin(name, info, $ClassDefiner) {
    this.name = name;
    this.info = info;
    this.$ClassDefiner = $ClassDefiner;
}

Plugin.prototype = {
    invoke: function ($Class, args) {
        var continueInvoke = this.onInvoke.apply(this, [
            {
                $Class: $Class,
                args: args
            }
        ].concat(args));

        if (continueInvoke !== false) {
            this.apply($Class, args);
        }
    },
    apply: function ($Class, args) {
        var continueApply = this.onApply.apply(this, [
            {
                $Class: $Class,
                args: args
            }
        ].concat(args));

        if (continueApply !== false) {
            if (ot.isObject(this.info.level)) {
                ot.forEach(this.info.level, function (value, level) {
                    Plugin.levels[level](this, $Class, args);
                }, this);
            } else {
                Plugin.levels[this.info.level](this, $Class, args);
            }
        }
    },
    getLevelObject: function (info) {
        if (ot.isObject(this.info.level)) {
            if ("component" in info) {
                if (info.component.mainPlugin === this) {
                    return this.info.level.OwnComponent;
                } else {
                    return this.info.level.Component;
                }
            } else {
                return this.info.level.Class;
            }
        } else {
            return this.info;
        }
    },
    onDefinition: generateEventHandler("onDefinition"),
    onInstanceCreation: generateEventHandler("onInstanceCreation"),
    onInvoke: function () {
        return ot.result(this.info, "onInvoke", arguments);
    },
    onApply: function () {
        return ot.result(this.info, "onApply", arguments);
    },
    getInfo: function (level, property, pluginArgs, $Class) {
        var args = [
            {
                $Class: $Class,
                args: pluginArgs
            }
        ].concat(pluginArgs);

        if (ot.isObject(this.info.level)) {
            if (level in this.info.level) {
                return ot.result(this.info.level[level], property, args);
            }
        } else if (this.info.level === level) {
            return ot.result(this.info, property, args);
        }
        return null;
    }
};

Plugin.priorities = {
    "high": 10,
    "medium": 20,
    "low": 30,
    "OwnComponent": -10000, // TODO implement this
    "default": 30
};

Plugin.levels = {
    Component: function (plugin, $Class, args) {
        var position = plugin.getInfo("Component", "position", args, $Class);
        switch (position) {
            case "before":
                $Class.queuedComponentPlugins.addPlugin(plugin, args);
                break;
            case "after":
                var lastComponent = $Class.components[$Class.components.length - 1];
                if (lastComponent) {
                    lastComponent.pluginList.addPlugin(plugin, args);
                }
                break;
            default:
                throw "A Component level plugin does not have a good " +
                    "`position: 'before'|'after'` property. Plugin: " + plugin.name;
        }
    },
    Class: function (plugin, $Class, args) {
        var execute = plugin.getInfo("Class", "execute", args, $Class);
        switch (execute) {
            case "first":
                $Class.ClassPluginsFirst.addPlugin(plugin, args);
                break;
            case "last":
                $Class.ClassPluginsLast.addPlugin(plugin, args);
                break;
            case "both":
                $Class.ClassPluginsFirst.addPlugin(plugin, args);
                $Class.ClassPluginsLast.addPlugin(plugin, args);
                break;
            default:
                throw "A Class level plugin does not have a good `" +
                    "execute: 'first'|'last'` property. Plugin: " + plugin.name;
        }
    },
    OwnComponent: function (plugin, $Class, args) {
        var componentDetails = plugin.getInfo("OwnComponent", "component", args, $Class),
            component = new Component($Class, plugin, componentDetails);

        component.pluginList.addPlugin(plugin, args);
        $Class.addComponent(component);

        component.pluginList.addPlugins($Class.queuedComponentPlugins);
        $Class.queuedComponentPlugins.reset();
    }
};

function generateEventHandler(name) {
    return function (info) {
        var continueExec, levelObj = this.getLevelObject(info);
        if (name in this.info) {
            continueExec = ot.result(this.info, name, arguments);
        }
        if (continueExec !== false && name in levelObj) {
            continueExec = ot.result(levelObj, name, arguments);
        }

        return continueExec;
    };
}

function PluginList(component, $Class) {
    EventEmitter.call(this);
    this.component = component;
    this.plugins = {};
    this.$Class = $Class;
    this.$ClassDefiner = $Class.$ClassDefiner;
    this.order = null;
}

PluginList.prototype = ot.inherit(EventEmitter.prototype, {
    reset: function () {
        this.plugins = {};
        this.order = null;
    },
    addPlugin: function (plugin, args) {
        this.plugins[plugin.name] = args;
    },
    addPlugins: function (pluginsObject) {
        if (pluginsObject instanceof  PluginList) {
            this.addPlugins(pluginsObject.plugins);
        } else {
            var registeredPlugins = this.$ClassDefiner.registeredPlugins;
            ot.forEach(pluginsObject, function (args, name) {
                this.addPlugin(registeredPlugins[name], args);
            }, this);
        }
    },
    execute: function (on, infoArgs) {
        var registeredPlugins = this.$ClassDefiner.registeredPlugins;

        if (!this.order) this.refreshOrder();

        this.emit("beforeExec", on, infoArgs, this);
        for (var i = 0; i < this.order.length; i++) {
            var name = this.order[i],
                args = this.plugins[name], keepPlugin;
            infoArgs[0].args = args;

            keepPlugin = registeredPlugins[name][on].apply(registeredPlugins[name], infoArgs.concat(args));
            if (keepPlugin === false) {
                this.order.splice(i, 1);
                delete this.plugins[name];
                i--;
            }
        }
        delete infoArgs[0].args;
        this.emit("afterExec", this);
    },
    refreshOrder: function () {
        var order = [],
            plugins = this.plugins,
            registeredPlugins = this.$ClassDefiner.registeredPlugins;

        for (var key in plugins) {
            if (key in registeredPlugins) {
                order.push(key);
            }
        }

        order.sort(function (a, b) {
            return registeredPlugins[a].priority - registeredPlugins[b].priority;
        });

        return this.order = order;
    }
});

BaseClass.registeredPlugins = {};
BaseClass.addPlugin = function addPlugin(name, info) {
    if (ot.isObject(name)) {
        info = name;
        name = info.name;
    } else {
        info.name = name;
    }

    ot.softMerge(info, {
        level: "Component",
        priority: Plugin.priorities["default"]
    });
    var plugin = new Plugin(name, info, this);

    ot.navigate.setOwn(this.prototype, name, function () {
        plugin.invoke(this.$Class, ot.toArray(arguments));
    });

    ot.navigate.setOwn(this.valuesToExport, name, exportClassFn(name));

    this.registeredPlugins[name] = plugin;
};

var currentlyBuilding = [];

function exportClassFn(road) {
    if (road.indexOf(".") !== -1) {
        return function () {
            var $Class = this.$Class || currentlyBuilding[0];
            var fn = ot.navigate.get($Class, road);
            if (ot.isFn(fn)) {
                fn.apply($Class, arguments);
            }
        };
    } else {
        return function () {
            var $Class = this.$Class || currentlyBuilding[0];
            if (ot.isFn($Class[road])) {
                $Class[road].apply($Class, arguments);
            }
        };
    }
}

function addExport(exportTo, $ClassDefiner) {
    var valuesToExport = $ClassDefiner.valuesToExport,
        oldValues = exportTo.$$oldValues = {};
    ot.forEach(valuesToExport, function (value, key) {
        if (exportTo.hasOwnProperty(key)) {
            oldValues[key] = exportTo[key];
        }
        exportTo[key] = value;
    });
    if (exportTo.$Class instanceof BaseClass) {
        currentlyBuilding.push(exportTo.$Class);
    }
}

function removeExport(exportedTo, $ClassDefiner) {
    var valuesToExport = $ClassDefiner.valuesToExport;
    if (exportedTo.$Class instanceof BaseClass) {
        if (currentlyBuilding[0] === exportedTo.$Class) {
            currentlyBuilding.shift();
        }
    }
    if (exportedTo.$$oldValues) {
        var oldValues = exportedTo.$$oldValues;
        ot.forEach(valuesToExport, function (value, key) {
            if (oldValues[key]) {
                exportedTo[key] = oldValues[key];
            } else {
                delete exportedTo[key];
            }
        });
        delete exportedTo.$$oldValues;
    }
}

ot.merge(BaseClass.prototype, {
    getOwnComponentBy: function (field, value) {
        for (var i = 0; i < this.components.length; i++) {
            if (this.components[i][field] === value) {
                return this.components[i];
            }
        }
        return null;
    },
    getComponentBy: function (field, value) {
        return this.getOwnComponentBy(field, value);
    },

    getOwnComponentsBy: function (field, value) {
        var validComponents = [];
        for (var i = 0; i < this.components.length; i++) {
            if (this.components[i][field] === value) {
                validComponents.push(this.components[i]);
            }
        }
        return validComponents;
    },
    getComponentsBy: function (field, value) {
        return this.getOwnComponentsBy(field, value);
    },

    //searches in the Class hierarchy
    getConstructorComponent: function () {
        return this.getComponentBy("name", this.config.constructorName);
    },

    getConstructorName: function () {
        var component = this.getConstructorComponent();

        return component ? component.name : null;
    }
});

BaseClass.prototype.handleParams = function (args) {
    var params = {
        name: null,
        classConfig: null,
        definition: null
    };

    ot.forEach(args, function (value) {
        switch (typeof value) {
            case "string":
                params.name = value;
                break;
            case "object":
                params.classConfig = value;
                break;
            case "function":
                params.definition = value;
                break;
        }
    });

    if (params.classConfig !== null && params.definition === null) {
        for (var key in params.classConfig) {
            if (params.classConfig.hasOwnProperty(key) && !(key in this.config)) {
                params.definition = params.classConfig;
                params.classConfig = null;
                break;
            }
        }
    }

    if (ot.isObject(params.definition)) {
        params.definition = (function (definition) {
            return function () {
                ot.forEach(definition, function (value, key) {
                    if (ot.isFn(this[key])) {
                        this[key](value);
                    } else if (key.indexOf(".") !== -1) {
                        var fn = ot.navigate.get(this, key);
                        if (ot.isFn(fn)) {
                            fn(value);
                        }
                    } else {
                        this[this.$Class.config.defaultMethod](key, value);
                    }
                }, this);
            };
        }(params.definition));
    }

    return params;
};

BaseClass.addPlugin("Constructor", {
    onApply: function(info, fn){
        info.$Class.Public(info.$Class.config.constructorName, fn);
        return false;
    }
});

BaseClass.addPlugin("Extends", {
    level: {
        "Class": {
            execute: "first",
            priority: -100,
            onDefinition: function (info) {
                var extendedClass = info.$Class.extends;
                if (extendedClass) {
                    // TODO normalize `constructor`
                    info.$Class.classConstructor.prototype = ot.inherit(
                        extendedClass.classConstructor.prototype,
                        info.$Class.classConstructor.prototype
                    );

                    info.$Class.classConstructor.prototype[info.$Class.config.superName]
                        = extendedClass.classConstructor.prototype;
                }
                return false;
            }
        },
        "OwnComponent": {
            component: function (info) {
                return {value: info.$Class.extends};
            },
            onDefinition: false
        }
    },
    onApply: function (info, object) {
        // TODO string Extends
        if (object && object.$Class) {
            object = object.$Class;
        } else {
            throw "a Class was not given to .Extends()";
        }

        info.$Class.extends = object;
    }
});

BaseClass.addPlugin("Public", {
    level: "OwnComponent",
    component: function (info, name, value) {
        return {name: name, value: value};
    },
    onApply: function (info, name, value) {
        if (ot.isFn(name)) {
            value = name;
            name = value.name;
        }
        info.args[0] = name;
        info.args[1] = value || null;
    },
    onDefinition: function (info, name, value) {
        var prototype = info.$Class.classConstructor.prototype;

        function updatePrototype(value) {
            if (ot.isFn(value)) {
                prototype[name] = value
            } else {
                delete prototype[name];
            }
        }

        updatePrototype(value);
        info.component.on("change:value", updatePrototype);
    },
    onInstanceCreation: function (info, name, value) {
        if (!ot.isFn(value)) {
            info.instance[name] = value;
        }
    }
});
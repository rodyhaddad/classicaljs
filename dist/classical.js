/*! ClassicalJS v0.1.0 20-05-2014 
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

var Class = (function () {

/*! objectTools.js v0.9.0 17-04-2014
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
     * @param once If true, will stop at the first occurrence of `from`
     * @returns {Array} The cleaned array
     */
    function cleanArray(array, from, once) {
        for (var i = array.length - 1; i >= 0; i--) {
            if (array[i] === from) {
                array.splice(i, 1);
                if (once) {
                    break;
                }
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
     * @param {Boolean} [includeProto] If true, properties in the prototype will be iterated over
     * @returns {*} The obj passed in
     */
    function forEach(obj, iterator, context, includeProto) {
        var key, len;
        if (obj) {
            if (isArray(obj)) {
                for (key = 0, len = obj.length; key < len; key++) {
                    iterator.call(context, obj[key], key);
                }
            } else if (obj.forEach && obj.forEach !== forEach) {
                obj.forEach(iterator, context);
            } else {
                for (key in obj) {
                    if ((includeProto || obj.hasOwnProperty(key)) && key.substring(0, 2) != "$$") {
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
                if (( isObject(obj[key]) || (isFn(obj[key]) && !isEmptyObject(obj[key])) ) && globalObj !== obj[key] && !isArray(obj[key])) {
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
            if (!superObj.hasOwnProperty('$$boundChildren')) {
                if (isArray(superObj.$$boundChildren)) {
                    var parentChildren = superObj.$$boundChildren;
                    superObj.$$boundChildren = [obj];
                    superObj.$$boundChildren.$$parentChildren = parentChildren;
                } else {
                    superObj.$$boundChildren = [obj];
                }
            } else {
                superObj.$$boundChildren.push(obj);
            }

            if (fnEachLevel) {
                fnEachLevel(obj, superObj, level);
            }

        });
    }

    /**
     * Unbind an object from it's bound-inherited parent
     *
     * @param obj {Object} The object to unbind from its parent
     * @returns {Object} The resulting object
     */
    function unbindInherit(obj) {
        var boundChildren = obj.$$boundChildren;
        if (obj.hasOwnProperty('$$boundChildren')) {
            boundChildren = boundChildren.$$parentChildren;
        }
        cleanArray(boundChildren, obj, true);
        for (var key in obj) {
            if (obj.hasOwnProperty(key) && obj[key] && obj[key].$$boundChildren) {
                unbindInherit(obj[key]);
            }
        }
        return obj;
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
        'function': function (value, key, setOwn) {
            if (setOwn && !this.hasOwnProperty(key)) {
                // it's a boundInherit because we're returning a function
                // and its __proto__ can't be the other function
                this[key] = boundInherit(this[key]);
            }
        },
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
        boundInherit: boundInherit, bindInherit: boundInherit,
        unbindInherit: unbindInherit,

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

// having the classConstructor name be `name`
// helps with debugging a lot
function createDynamicNameFn(name, toCall) {
    var fn;
    if (!name || isCspOn()) {
        fn = function () {
            if (this instanceof fn) {
                return toCall.asConstructor.apply(this, ot.toArray(arguments));
            } else {
                return toCall.asFunction.apply(this, ot.toArray(arguments));
            }
        };
    } else {
        /*jshint evil:true */
        fn = new Function("toCall", "toArray",
            "" +
                "function " + name + "(){ " +
                "    if(this instanceof " + name + ") {" +
                "        return toCall.asConstructor.apply(this, toArray(arguments)); " +
                "    } else {" +
                "        return toCall.asFunction.apply(this, toArray(arguments));" +
                "    }" +
                "} " +
                "return " + name + ";")(toCall, ot.toArray);
    }

    return fn;
}

function isCspOn() {
    return !!ot.navigate.get(ot.globalObj, 'document.securityPolicy.isActive');
}

function exportClassFn(road) {
    var getFn;
    if (ot.isFn(road)) {
        getFn = function () { return road; };
    } else {
        if (road.indexOf(".") === -1) {
            getFn = function ($class) { return $class[road]; };
        } else {
            getFn = function ($class) { return ot.navigate.get($class, road); };
        }
    }

    exportedFn.valueOf = function () {
        return this() || exportedFn;
    };
    return exportedFn;
    function exportedFn() {
        var $class = this.$class || currentlyBuilding[0];
        if ($class instanceof BaseClass) {
            var fn = getFn($class);
            if (ot.isFn(fn)) {
                var val = fn.call($class, ot.toArray(arguments));
                return val === $class ? $class.classConstructor : val;
            } else {
                throw "The method '" + road + "' does not exist on Class: " + $class.name;
            }
        }
    }
}

// TODO refactor this
// Globalize .fnToExport
var fnToExportHandlers = {
    beforeDefined: function ($class) {
        var oldValues = $class.$classDefiner.$$oldGlobalValues = {}; // hold the old global vals
        ot.forEach($class.$classDefiner.fnToExport, function (val, key) {
            oldValues[key] = ot.globalObj[key];
            ot.globalObj[key] = $class.classConstructor[key] = val;
        }, this, true);
    },
    afterDefined: function ($class) {
        var oldValues = $class.$classDefiner.$$oldGlobalValues;
        ot.forEach(oldValues, function (oldVal, key) {
            delete $class.classConstructor[key];
            if (ot.isUndefined(oldVal)) {
                delete ot.globalObj[key];
            } else {
                ot.globalObj[key] = oldVal;
            }
        });
        $class.$classDefiner.$$oldGlobalValues = {};
    }
};

function addAnnotation(name, info) {
    this.addDecorator(name, {
        decorate: function (component) {
            component.annotations = component.annotations || [];
            if (ot.isFn(info.annotation)) {
                var annotation = ot.inherit(info.annotation.prototype),
                    returnedValue = info.annotation.apply(annotation, ot.toArray(arguments));

                component.annotations.push(
                    ot.isObject(returnedValue) || ot.isFn(returnedValue) ? returnedValue : annotation);
            } else {
                component.annotations.push(info.annotation);
            }
        }
    });
}

function addClassAnnotation(name, info) {
    this.addClassDecorator(name, {
        globalize: info.globalize,
        decorate: function ($class) {
            var annotations = $class.annotations;
            if (ot.isFn(info.annotation)) {
                var annotation = ot.inherit(info.annotation.prototype),
                    returnedValue = info.annotation.apply(annotation, ot.toArray(arguments));

                annotations.push(
                    ot.isObject(returnedValue) || ot.isFn(returnedValue) ? returnedValue : annotation);
            } else {
                annotations.push(info.annotation);
            }
        }
    });
}

function addClassDecorator(name, info) {
    var $classDefiner = this;
    var queuedDecorators = $classDefiner.queuedDecorators;
    if (info.globalize) {
        ot.navigate.set(ot.globalObj, name, function () {
            var args = ot.toArray(arguments);
            queuedDecorators.push(function ($class) {
                callDecorator.call($class, args);
            });
        });
        $classDefiner.events.on('destroy', function () {
            ot.navigate(ot.globalObj, name, function (value, key, i, road) {
                if (i === road.length - 1) {
                    delete this[key];
                    return false;
                }
            });
        });
    } else {
        var exportFn = exportClassFn(callDecorator);
        ot.navigate.set($classDefiner.fnToExport, name, exportFn, true);
    }

    function callDecorator (args) {
        info.decorate.apply(info, [this].concat(args));

        if (info.on && !this.$$usedPlugins[name]) {
            var on = ot.result(info, 'on', [this]);
            this.on(on, info);
        }
        this.$$usedPlugins[name] = true;
    }
}

function addComponent(name, info) {
    this.addClassDecorator(name, {
        on: info.on && function ($class) {
            var on = ot.result(info, 'on', [$class]);
            $class.on(on, info);
        },
        decorate: function ($class) {
            $class.addComponent(info.createComponent.apply(info, ot.toArray(arguments)));
        }
    });
}

function addDecorator(name, info) {

    this.addClassDecorator(name, {
        on: info.on && function ($class) {
            var on = ot.result(info, 'on', [$class]);
            $class.on(on, info);
        },
        decorate: function($class) {
            var lastComponent, args = ot.toArray(arguments);
            if (info.after && ot.result(info, 'after', [lastComponent = $class.getLastComponent()].concat(args))) {
                info.decorate.apply(info, [lastComponent].concat(args));
            } else {
                $class.once('newComponent', function (component) {
                    info.decorate.apply(info, [component].concat(args));
                }, this);
            }
        }
    });
}

var currentlyBuilding = [];
var BaseClass = createBaseClass();

function createBaseClass() {
    var Class = ClassDefinerFactory('BaseClass');
    Class.addClassDecorator = addClassDecorator;
    Class.addClassAnnotation = addClassAnnotation;
    Class.addComponent = addComponent;
    Class.addDecorator = addDecorator;
    Class.addAnnotation = addAnnotation;

    Class.eventListeners.push(fnToExportHandlers);
    Class.eventListeners.push({
        beforeDefined: function ($class) {
            var queuedDecorators = $class.$classDefiner.queuedDecorators;
            ot.forEach(queuedDecorators, function runDecorator(decorator) {
                if (ot.isArray(decorator)) {
                    ot.forEach(decorator, runDecorator);
                    decorator.length = 0;
                } else {
                    decorator($class);
                }

            });
            queuedDecorators.length = 0;
        }
    });

    return Class;
}

function ClassDefinerFactory(definerName, parent) {
    var ClassDefiner = createDynamicNameFn(definerName, {
        asConstructor: handleNewClass,
        asFunction: handleNewClass
    });

    ot.merge(ClassDefiner, parent || {
        ot: ot,
        EventEmitter: EventEmitter,
        child: function (name) {
            var childClassDefiner = ClassDefinerFactory(name, this);
            this.events.emit('newChild', [childClassDefiner]);
            return childClassDefiner;
        },
        destroy: function () {
            if (parent) {
                ot.unbindInherit(this.prototype);
                ot.unbindInherit(this.fnToExport);
            }
            this.events.emit('destroy');
        }
    });

    if (!parent) {
        ClassDefiner.fnToExport = {};
        ClassDefiner.eventListeners = [];
        ClassDefiner.queuedDecorators = [];
        ClassDefiner.prototype = ot.inherit(EventEmitter.prototype, {
            addComponent: function (component) {
                this.components.push(component);
                this.emit('newComponent', [component, this]);
            },
            getLastComponent: function () {
                return this.components[this.components.length-1];
            }
        });
    } else {
        ClassDefiner.fnToExport = ot.boundInherit(parent.fnToExport);
        ClassDefiner.eventListeners = [parent.eventListeners];
        ClassDefiner.queuedDecorators = [parent.queuedDecorators];
        ClassDefiner.prototype = ot.boundInherit(parent.prototype);
    }

    ClassDefiner.events = new EventEmitter();

    ClassDefiner.prototype.constructor = ClassDefiner;

    return ClassDefiner;

    function handleNewClass(name, definitionFn) {
        if (!(this instanceof ClassDefiner)) {
            return new ClassDefiner(name, definitionFn);
        }
        EventEmitter.call(this);

        var Class = this;

        this.$classDefiner = ClassDefiner;

        this.name = name;
        this.classConstructor = createDynamicNameFn(name, {
            asConstructor: function () {
                Class.emit('newInstance', [this, ot.toArray(arguments)]);
            },
            asFunction: ot.noop
        });
        this.classConstructor.$class = this;
        this.classConstructor.prototype.$class = this;

        this.$$usedPlugins = {};
        this.components = [];
        this.annotations = [];

        ClassDefiner.events.emit('newClass', [this]);

        // add listeners
        ot.forEach(ClassDefiner.eventListeners, function addListeners(listeners) {
            if (ot.isArray(listeners)) {
                ot.forEach(listeners, addListeners, this);
            } else {
                this.on(listeners);
            }
        }, this);

        this.emit('beforeDefined', [this]);

        currentlyBuilding.unshift(this);
        definitionFn.call(this.classConstructor);
        currentlyBuilding.shift();

        this.emit('defined', [this]);
        this.emit('afterDefined', [this]);
        return this.classConstructor;
    }
}

    return BaseClass;
}());
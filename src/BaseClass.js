var currentlyBuilding = [];
var BaseClass = ClassDefinerFactory('BaseClass');

function ClassDefinerFactory(definerName, parent) {
    var Class = createDynamicNameFn(definerName, {
        asConstructor: handleNewClass,
        asFunction: handleNewClass
    });

    ot.merge(Class, parent || {
        ot: ot,
        EventEmitter: EventEmitter,
        child: function (name) {
            return ClassDefinerFactory(name, this);
        },
        destroy: function () {
            if (parent) {
                ot.unbindInherit(this.prototype);
                ot.unbindInherit(this.fnToExport);
            }
        }
    });

    if (!parent) {
        Class.fnToExport = {};
        Class.eventListeners = [];
        Class.prototype = ot.inherit(EventEmitter.prototype, {
            addComponent: function (component) {
                this.components.push(component);
                this.emit('newComponent', [component, this]);
            },
            getLastComponent: function () {
                return this.components[this.components.length-1];
            }
        });
    } else {
        Class.fnToExport = ot.boundInherit(parent.fnToExport);
        Class.eventListeners = [parent.eventListeners];
        Class.prototype = ot.boundInherit(parent.prototype);
    }
    Class.queuedDecorators = [];

    Class.prototype.constructor = Class;

    return Class;

    function handleNewClass(name, definitionFn) {
        if (!(this instanceof Class)) {
            return new Class(name, definitionFn);
        }
        EventEmitter.call(this);

        this.$classDefiner = Class;

        this.name = name;
        this.classConstructor = createDynamicNameFn(name, {
            asConstructor: ot.noop,
            asFunction: ot.noop
        });

        this.$$usedPlugins = {};

        this.classConstructor.$class = this;
        this.classConstructor.prototype.$class = this;

        // add listeners
        ot.forEach(Class.eventListeners, function addListeners(listeners) {
            if (ot.isArray(listeners)) {
                ot.forEach(listeners, addListeners, this);
            } else {
                this.on(listeners);
            }
        }, this);

        this.emit('beforeDefined', [this]);

        this.components = [];
        currentlyBuilding.unshift(this);
        definitionFn.call(this.classConstructor);
        currentlyBuilding.shift();

        this.emit('defined', [this]);
        this.emit('afterDefined', [this]);
        return this.classConstructor;
    }
}
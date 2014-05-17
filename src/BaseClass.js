var currentlyBuilding = [];
var BaseClass = createBaseClass();

function createBaseClass() {
    var Class = ClassDefinerFactory('BaseClass');
    Class.addClassDecorator = addClassDecorator;
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
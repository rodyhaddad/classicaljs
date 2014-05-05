//var currentlyBuilding = [];

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

// Globalize .fnToExport
BaseClass.eventListeners.push({
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
});
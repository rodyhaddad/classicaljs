var currentlyBuilding = [];

function exportClassFn(road) {
    if (road.indexOf(".") !== -1) {
        return function () {
            var $Class = this.$Class || currentlyBuilding[0];
            var fn = ot.navigate.get($Class, road);
            if (ot.isFn(fn)) {
                var val = fn.apply($Class, arguments);
                return val === $Class ? $Class.classConstructor : val;
            } else {
                throw "The method '" + road + "' does not exist on Class: " + $Class.name;
            }
        };
    } else {
        return function () {
            var $Class = this.$Class || currentlyBuilding[0];
            if (ot.isFn($Class[road])) {
                var val = $Class[road].apply($Class, arguments);
                return val === $Class ? $Class.classConstructor : val;
            } else {
                throw "The method '" + road + "' does not exist on Class: " + $Class.name;
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
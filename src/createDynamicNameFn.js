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
describe("Class.EventEmitter", function () {
    var evtEmitter, fired;
    it("should be set at Class.EventEmitter", function () {
        expect(Class.EventEmitter).toBeDefined();
    });

    beforeEach(function () {
        evtEmitter = new Class.EventEmitter();
        fired = 0;
    });

    it(".on allows you to add a listener to an event", function () {
        var context = {};

        evtEmitter.on("event", function () {
            fired++;
            expect(this).toBe(context);
        }, context);

        evtEmitter.emit("event");
        expect(fired).toBe(1);

        evtEmitter.emit("event");
        expect(fired).toBe(2);
    });

    it(".off allows you to remove a listener to an event", function () {
        var context = {}, listener;

        evtEmitter.on("event", listener = function () {
            fired++;
            expect(this).toBe(context);
        }, context);

        evtEmitter.emit("event");
        expect(fired).toBe(1);

        evtEmitter.off("event", listener);

        evtEmitter.emit("event");
        expect(fired).toBe(1);
    });

    it(".once allows you to add a listener that will fire once", function () {
        var context = {};

        evtEmitter.once("event", function () {
            fired++;
            expect(this).toBe(context);
        }, context);

        evtEmitter.emit("event");
        expect(fired).toBe(1);

        evtEmitter.emit("event");
        expect(fired).toBe(1);
    });

    it(".removeAllListeners allows you to remove all listener of an event", function () {
        var context = {};

        function listener() {
            fired++;
            expect(this).toBe(context);
        }

        evtEmitter
            .on("event", listener, context)
            .on("event", listener, context);

        evtEmitter.emit("event");
        expect(fired).toBe(2);

        evtEmitter.removeAllListeners("event");

        evtEmitter.emit("event");
        expect(fired).toBe(2);
    });
    it(".removeAllListeners allows you to remove all listener of an event", function () {
        var context = {};

        function listener() {
            fired++;
            expect(this).toBe(context);
        }

        evtEmitter
            .on("event1", listener, context)
            .on("event2", listener, context);

        evtEmitter.emit("event1").emit("event2");
        expect(fired).toBe(2);

        evtEmitter.removeAllListeners();

        evtEmitter.emit("event1").emit("event2");
        expect(fired).toBe(2);
    });

    it(".addListener is an alias to .on", function () {
        expect(evtEmitter.addListener).toBe(evtEmitter.on);
    });

    it(".removeListener is an alias to .off", function () {
        expect(evtEmitter.removeListener).toBe(evtEmitter.off);
    });

    it(".trigger is an alias to .emit", function () {
        expect(evtEmitter.trigger).toBe(evtEmitter.emit);
    });

});
Class.Config({
    keepDefinedClasses: false,
    allowJSNativeMode: false
});

Class.functionsToExport.public = Class.functionsToExport.Public

//test the basic Public/Private methods, as well as Constructors
describe("[Basic] A Class in ClassicalJS", function(){
    
    var constructCalls = 0;
    
    var testClass = 
        Class("testClass")
            
            /*
             *  Just helpers for accessing private stuff
             *   get: returns a private property
             *   call: calls and returns a private method
             */
            Public(function get(propertyName){
                return this[propertyName];
            });
            
            Public(function call(methodName){
                return this[methodName]();
            });
            
            Constructor(function(){
                constructCalls++ ;
            })
            
            
            Public("publicProperty", 1);
            Private("privateProperty", 2);
            
            
            Public("publicMethod", function(){
                return 3;
            });
            
            Private(function privateMethod(){
                return 4;
            });
            
        End();
        
    var testInstance = new testClass();
    
    it("can have Private and Public properties with default values", function(){
        expect(testInstance.publicProperty).toBe(1);
        
        expect(testInstance.privateProperty).toBeUndefined();
        
        expect(testInstance.get("privateProperty")).toBe(2);
        
    });
    
    
    it("can have Private and Public methods", function(){
        
        expect(testInstance.publicMethod()).toBe(3);
        
        expect(testInstance.privateMethod).toBeUndefined();
        
        expect(testInstance.call("privateMethod")).toBe(4);
        
    });
    
    it("can have a Constructor that is called once for each new instance", function(){
        expect(constructCalls).toBe(1);
    });
    
});

//Test all the configuration options
describe("[Configs] A Class in ClassicalJS", function(){
    
    it("has a constructorName config", function(){
        var test = 
            Class("test", {constructorName: "construct"})
                
                Constructor(function(){
                    expect(this.construct).toEqual( jasmine.any(Function) )
                    expect(this.init).toBeUndefined()
                });
                
            End();
        
        new test();
        
        
    });
    
    it("has a superName config", function(){
        var toInheret = 
            Class("toInheret")
            
                Protected(function inheretedMethod(){
                    
                })
                
            End()
        
        var inheritTest = 
            Class("inheritTest", { superName: "_super" }).Extends(toInheret)
            
                Constructor(function(){
                    expect(this._super.inheretedMethod).toBeDefined();
                })
            
            End()


        new inheritTest();
        
    })
    
    
    it("has a globalize config", function(){
        
        var testClass = 
            Class("globalizeTest1", { globalize: false })
    
                expect(typeof Public === "undefined").toBe(true);
            
            testClass.End();
        
        
        var testClassGlobal = 
            Class("globalizeTest2", { globalize: true })
    
                expect(typeof Public === "undefined").toBe(false);
            
            testClassGlobal.End();
        
        
    })
    
    
});

describe("[Inheritance] A Class in ClassicalJS", function(){
    
});

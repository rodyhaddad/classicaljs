# Classical.js


Classical.js is an adaptation of the OOP concepts of classical programming languages (PHP, C#, C++, Java) behaviours in JavaScript, without any emulation, parsing or compiling.

## Usage
  ```javascript
  
  var Person = Class("Person")
  
    Private ("firstName");
    Private ("LastName");
    
    Public (function setFirstName(firstName){
      this.firstName = firstName;
    });

    Public (function setLastName(lastName){
      this.lastName = lastName;
    });
    
    Public(function getFullName(){
      return this.firstName + " " + this.lastName;
    });
    
  End()

  
  var Programmer = Class("Programmer").Extends("Person")
  
    Private ("knownProgrammingLanguages");
    
    Constructor (function(){
        this.knownProgrammingLanguages = [];
    })
    
    Public (function addKnownLanguage(languageName){
      this.knownProgrammingLanguages.push(languageName);
    })
    
    Public (function summary(){
        return this.getFullName() + " knows the following languages: " + this.knownProgrammingLanguages.join(", ");
    })
    
  End()

  var me = new Programmer();
  
  me.setFirstName("Rody");
  me.setLastName("Haddad");
  
  me.addKnownLanguage("HTML");
  me.addKnownLanguage("CSS");
  me.addKnownLanguage("JavaScript");
  me.addKnownLanguage("PHP");
  
  console.log(me.summary()); //Rody Haddad knows the following languages: HTML, CSS, JavaScript, PHP 
  ```

##Notes

I'm currently working on writing the complete documentation in this Repository's Wiki (just click above on "Wiki" to see the progress :) )

Many new features have been added (Plugins, Imports, etc.), but they're not 100% stable.  
They are being developed in the `dev` branch.  
Once they're stable and test proof, they will be merged to the master branch.  

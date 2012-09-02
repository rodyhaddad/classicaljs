Classical.js
===========

Classical.js is an adaptation of classical programming languages (PHP, C#, C++, Java) behaviours in JavaScript, without any emulation, parsing or compiling.

### Usage
  ```
  Class("Person")
    Private("firstName", "lastName");
    
    Public(function getFullName(){
      return this.firstName + " " + this.lastName;
    });
    
    Public (function setFirstName(firstName){
      this.firstName = firstName;
    });
    
    Public (function setLastName(lastName){
      this.lastName = lastName;
    });
  End()

  var me = new Person();
  me.setFirstName("Rody");
  me.setLastName("Haddad");
  
  console.log(me.getFullName());
  ```

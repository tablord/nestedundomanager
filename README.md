# nestedundomanager
[![Build Status](https://travis-ci.com/tablord/nestedundomanager.svg?branch=master)](https://travis-ci.com/tablord/nestedundomanager)


undo manager that can nest actions into actions (specially if you need actions that can be executed in an other action like a macro)

Like a lot of undo manager you first have to instantiate on undo manager

    undo = new UndoManager('main'); 

in order to add some undoable action just add a new action. 
```javascript 1.8
    var myVariable = 0;
    setMyVariable = function(newValue) {
      let oldValue = myVariable;
      undo.execute('setMyVariable',
                   function() {myVariable = oldValue},  // thanks to closure, oldValue will be kept 
                                                        // in the undo function
                   function() {myVariable = newValue}); // same mechanism: newValue is a closure so it will
                                                        // be kept
    };

    setMyVariable(5) ; // MyVariable == 5;
    undo.undo();       // MyVariable == 0;
    undo.redo();       // MyVariable == 5;
```

it is also capable of combining action together as a single action

```javascript 1.8

    setObjAttr = function(obj, attribute, newValue) {
      let oldValue = obj[attribute];
      undo.execute('setMyVariable',
                   function() {obj[attribute] = oldValue},  // thanks to closure, oldValue will be kept 
                                                            // in the undo function
                   function() {obj[attribute] = newValue}); // same mechanism: newValue is a closure so it will
                                                            // be kept
    };
    var myObj = {};
    setObjAttr(myObj,'toto',5) ; // obj.toto == 5;
    undo.undo();                 // obj.toto == undefined;
    undo.redo();                 // obj.toto == 5;

    // now you may want to group change in one single action

    var manager = {first:'John',last:'Smith'};
    undo.begin('change manager');
    setObjAttr(manager,'first','Bob');
    setObjAttr(manager,'last','Sponge');
    undo.end();                  // manager === {first:'Bob',last:'Sponge'}
    undo.undo();                 // manager === {first:'John',last:'Smith'}
    
```

It has also a capability of delegate actions which is usefull if you have both action
that directly modify your application and you embed in your application a component that already has 
a undo system (like ACE editor for example)

... more to come soon ...
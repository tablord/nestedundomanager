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
      undo.add({
        caption: 'setMyVariable',
        undo : function() {
          myVariable = oldValue;  // thanks to closure, oldValue will be kept 
                                     // in the undo function
        },
        redo: function() {
          myVariable = newValue;     // same mechanism: newValue is a closure so it will
                                     // be kept
        }
      }); 
    };

    setMyVariable(5) ; // MyVariable = 5;
    undo.undo();       // MyVariable = 0;
    undo.redo();       // MyVariable = 5;
```

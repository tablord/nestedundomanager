//
// nestedundomanager.js
// an undo manager that is capable of recording nested undo

//
// (CC-BY-SA 2019)Marc Nicole  according to https://creativecommons.org/
/////////////////////////////////////////////////////////////////////////////////
'use strict';

(function () {

  let UndoManager = function (caption) {
    // the Class that has only one instance where all EDI related object register
    // there action in order to make them undoable
    this.caption = caption;
    this.fromUndo = false; // is true while execution an undo or redo operation
    this.clear();
  };

  UndoManager.className = 'UndoManager';
  UndoManager.prototype.isUndoManager = true;

  UndoManager.prototype.clear = function () {
    // clear the undo redo stack // should never be used by a user
    // except to test the undoSystem itself
    this.undoStack = [];  // array of [[undoAction]]
    this.redoStack = [];
    this.openAction = undefined;  // the action in construction
    this.isAtomic = false; // if true, considered as one single action. this is the case after an end()
    return this;
  };

  UndoManager.prototype.begin = function (caption) {
    // begin a new action
    // return this for method chaining
    if (this.openAction) this.openAction.begin(caption); // if an action is already open delegate to this action (recursively)
    else this.openAction = new UndoManager(caption);
    return this;
  };

  UndoManager.prototype.end = function () {
    // end an action and push it to the undoStack
    // return this for method chaining
    if (this.openAction === undefined) throw Error('end is called on an already closed action');
    if (this.openAction.openAction) {// if an action is already open delegate to this action (recursively)
      this.openAction.end();
      return this
    }
    this.openAction.isAtomic = true;
    this.openAction.redoStack = []; // as this becomes atomic, we can no longer redo undone things
    this.undoStack.push(this.openAction);
    this.openAction = undefined;
    return this;
  };

  UndoManager.prototype.mergeWithPrevious = function(action,caption){
    // add action by merging it with the previous Undo action
    // if there is no previous action throw an error
    // if the previous action is Atomic, action will be pushed into its undo list
    // else a new Atomic action is created, the previous action is pushed ito it and action is then pushed
    // this new atomic action will have caption if defined, or the previous action.caption
    if (this.openAction) {
      this.openAction.mergeWithPrevious(action);
      return this;
    }
    let previousAction = this.undoStack.pop();
    if (!previousAction) throw Error("can't merge action if nothing in undoStack");
    if (!previousAction.isAtomic) {
      let p = previousAction;
      previousAction = new UndoManager(caption || previousAction.caption);
      previousAction.add(p).isAtomic = true;
    }
    previousAction.add(action);
    this.undoStack.push(previousAction);
    return this;
  };
  UndoManager.nop = function() {};

  UndoManager.prototype.execute = function(caption,undo,redo){
    // create an action and execute it (=redo it)
    let action = {caption:caption,undo:(undo || UndoManager.nop),redo:(redo || UndoManager.nop)};
    action.redo();
    this.add(action);
  };

  UndoManager.prototype.add = function (action) {
    // add a function object to the openAction
    // -undoObj: an [[undoObj]]
    // return this for method chaining
    if (this.openAction) {
      this.openAction.add(action);
      return this;
    }
    this.undoStack.push(action);
    this.redoStack = [];
    return this;
  };

  UndoManager.prototype.undo = function () {
    // undo the last action
    // return the caption of the undo action or undefined if nothing to undo
    this.fromUndo = true;
    if (this.openAction) { // if an openAction, delegate
      let res = this.openAction.undo();
      this.fromUndo = false;
      return res;
    }
    if (this.undoStack.length === 0) return undefined;

    if (this.isAtomic) {
      let res = [];
      while (this.undoStack.length) {
        let action = this.undoStack.pop();
        action.undo();
        this.redoStack.push(action);
        res.push(action.caption);
      }
      this.fromUndo = false;
      return '('+res.join(',')+')';
    }
    let action = this.undoStack.pop();
    if (!action) return undefined;
    let r = action.undo() || '';
    this.redoStack.push(action);
    this.fromUndo = false;
    return 'undo ' + action.caption+ r;
  };

  UndoManager.prototype.redo = function () {
    // redo the last undone action
    // return the caption of the redo action or undefined if nothing to undo
    this.fromUndo = true;
    if (this.openAction) { // if an openAction, delegate
      let res = this.openAction.redo();
      this.fromUndo = false;
      return res;
    }

    if (this.redoStack.length === 0) return undefined;

    if (this.isAtomic) {
      let res = [];
      while (this.redoStack.length) {
        let action = this.redoStack.pop();
        action.redo();
        this.undoStack.push(action);
        res.push(action.caption);
      }
      this.fromUndo = false;
      return '('+res.join(',')+')';
    }
    this.fromUndo = true;
    let action = this.redoStack.pop();
    if (!action) return undefined;
    let r = action.redo() || '';
    this.undoStack.push(action);
    this.fromUndo = false;
    return 'redo ' + action.caption + r;
  };

  UndoManager.prototype.undoList = function () {
    // return a list of caption that are inside the undo stack
    return this.undoStack.map(action => action.caption || 'undefined')
  };

  UndoManager.prototype.redoList = function () {
    // return a list of caption that are inside the undo stack
    return this.redoStack.map(action => action.caption || 'undefined')
  };

  UndoManager.prototype.debugHtml = function () {
    // display the UndoManager
    let h = '<h2>undo</h2>';
    for (let i = this.undoStack.length - 1; i >= 0; i--) {
      h += '<div>' + this.undoStack[i].caption + '</div>';
    }
    h += this.openAction ? '<h2>openAction</h2>' + this.openAction.debugHtml() : '';
    h += '<h2>redo</h2>';
    for (let i = 0; i < this.redoStack.length; i++) {
      h += '<div>' + this.redoStack[i].caption + '</div>';
    }
    return h;
  };


  if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
    // AMD. Register as an anonymous module.
    /* istanbul ignore next */
    define(function () {
      return UndoManager;
    });
  } else if ((typeof process !== 'undefined') && !process.browser) {
    module.exports = UndoManager;
  } else {
    window.UndoManager = UndoManager;
  }

}());
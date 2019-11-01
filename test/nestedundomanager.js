// test for nestedundomanager
//
/////////////////////////////////////////////////////////////////////////////////////////
'use strict';


if (!process.browser) {
  require('should');
  var UndoManager = require('../js/nestedundomanager');
}

function dummy(caption) {return {caption:caption,undo:function(){},redo:function(){}}};

describe('nestedundomanager.js', function () {
  describe('UndoManager', function () {
    let undoManager = new UndoManager('main');
    it('must be empty at the beginning', function () {
      undoManager.undoStack.should.be.deepEqual([]);
      undoManager.redoStack.should.be.deepEqual([]);
    });
    it('must keep one action in the undo stack if added',function () {
      undoManager.add(dummy('first action'));
      undoManager.undoList().should.be.deepEqual(['first action']);
      undoManager.redoList().should.be.deepEqual([]);
    });
    it('must be redoable if undone',function(){
      undoManager.undo().should.be.equal('undo first action');
      undoManager.undoList().should.be.deepEqual([]);
      undoManager.redoList().should.be.deepEqual(['first action']);
    });
    it('must be undoable again if redo',function(){
      undoManager.redo().should.be.equal('redo first action');
      undoManager.undoList().should.be.deepEqual(['first action']);
      undoManager.redoList().should.be.deepEqual([]);
    });
    it('must clear redo if undone and new action added',function(){
      undoManager.undo().should.be.equal('undo first action');
      undoManager.undoList().should.be.deepEqual([]);
      undoManager.redoList().should.be.deepEqual(['first action']);
      undoManager.add(dummy('second action'));
      undoManager.undoList().should.be.deepEqual(['second action']);
      undoManager.redoList().should.be.deepEqual([]);
    });
    it('can have actions that are made of actions',function(){
      undoManager.begin('a composed action');
      undoManager.add(dummy('first sub action'));
      undoManager.add(dummy('second sub action'));
      undoManager.undoList().should.be.deepEqual(['second action']);
      undoManager.openAction.undoList().should.be.deepEqual(['first sub action','second sub action']);
      undoManager.undo().should.be.equal('undo second sub action');
      undoManager.openAction.undoList().should.be.deepEqual(['first sub action']);
      undoManager.end();
      undoManager.undoList().should.be.deepEqual(['second action','a composed action']);
      should.equal(undoManager.openAction,undefined);
    });
  })
});

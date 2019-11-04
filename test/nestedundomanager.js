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
    it('does nothing if nothing to redo',function(){
      should.equal(undoManager.redo(),undefined);
      undoManager.undoList().should.be.deepEqual(['first action']);
      undoManager.redoList().should.be.deepEqual([]);
    });
    it('does nothing if nothing to undo',function(){
      undoManager.undo().should.be.equal('undo first action');
      should.equal(undoManager.undo(),undefined);
      undoManager.redo();
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
      undoManager.begin('third sub action (composed)');
      undoManager.add(dummy('first sub sub action'));
      undoManager.add(dummy('second sub sub action'));
      undoManager.undo().should.be.equal('undo second sub sub action');
      undoManager.undo().should.be.equal('undo first sub sub action');
      should.equal(undoManager.undo(),undefined);
      undoManager.redo();
      undoManager.redo();
      undoManager.end();

      undoManager.undoList().should.be.deepEqual(['second action']);
      undoManager.openAction.undoList().should.be.deepEqual(['first sub action','second sub action','third sub action (composed)']);
      undoManager.undo().should.be.equal('undo third sub action (composed)');
      undoManager.openAction.undoList().should.be.deepEqual(['first sub action','second sub action']);
      undoManager.end();
      undoManager.undoList().should.be.deepEqual(['second action','a composed action']);
      should.equal(undoManager.openAction,undefined);
    });
    it('can display itself in html',function(){
      console.info(undoManager.debugHtml());
    });
    it('throw an error if you end() without begin()',function(){
      (function(){undoManager.end()}).should.throw('end is called on an already closed action');
    })
  })
});

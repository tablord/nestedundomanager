// test for nestedundomanager
//
/////////////////////////////////////////////////////////////////////////////////////////
'use strict';


if ((typeof process !== 'undefined') && !process.browser) {
  require('should');
  var UndoManager = require('../js/nestedundomanager');
}



describe('nestedundomanager.js', function () {
  describe('UndoManager', function () {
    let undoManager = new UndoManager('main');
    it('must be empty at the beginning', function () {
      undoManager.undoStack.should.be.deepEqual([]);
      undoManager.redoStack.should.be.deepEqual([]);
    });
    it('must keep one action in the undo stack if added',function () {
      undoManager.execute('first action');
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
      undoManager.execute('second action');
      undoManager.undoList().should.be.deepEqual(['second action']);
      undoManager.redoList().should.be.deepEqual([]);
    });
    it('can have actions that are made of actions',function(){
      undoManager.begin('a composed action');
      undoManager.execute('first sub action');
      undoManager.execute('second sub action');
      undoManager.begin('third sub action (composed)');
      undoManager.execute('first sub sub action');
      undoManager.execute('second sub sub action');
      undoManager.undo().should.be.equal('undo second sub sub action');
      undoManager.undo().should.be.equal('undo first sub sub action');
      should.equal(undoManager.undo(),undefined);
      undoManager.redo();
      undoManager.redo();
      undoManager.end();

      undoManager.undoList().should.be.deepEqual(['second action']);
      undoManager.openAction.undoList().should.be.deepEqual(['first sub action','second sub action','third sub action (composed)']);
      undoManager.undo().should.be.equal('undo third sub action (composed)(second sub sub action,first sub sub action)');
      undoManager.openAction.undoList().should.be.deepEqual(['first sub action','second sub action']);
      undoManager.end();
      undoManager.undoList().should.be.deepEqual(['second action','a composed action']);
      should.equal(undoManager.openAction,undefined);
    });
    it('atomic actions (that had a .begin(...)  .end()) behaves as one single action even if they are composed of sub actions', function(){
      undoManager.undo().should.be.equal('undo a composed action(second sub action,first sub action)');
      undoManager.redo().should.be.equal('redo a composed action(first sub action,second sub action)');
    });
    it('can display itself in html',function(){
      console.info(undoManager.debugHtml());
    });
    it('throw an error if you end() without begin()',function(){
      (function(){undoManager.end()}).should.throw('end is called on an already closed action');
    });
    it('can have delegateAction that will be in charge of the undo redo as long as needed',function(){
      undoManager.add({
        caption:'delegate action',
        i:3,
        hasUndoDelegation: function() {
          if (this.i >= 0) {
            console.info('accept undo delegation %d', this.i);
            return true
          }
          console.info('refuse undo delegation %d', this.i);
          return false
        },
        hasRedoDelegation: function(){
          if (this.i < 3) {
            console.info('accept redo delegation %d', this.i);
            return true
          }
          console.info('refuse redo delegation %d', this.i);
          return false
        },
        undo:function(){return 'delegated undo '+this.i-- },
        redo:function(){return 'delegated redo '+(++this.i) }
      });
      undoManager.undoList().should.be.deepEqual(['second action','a composed action','delegate action']);
      undoManager.undo().should.be.equal('delegated undo 3');
      undoManager.undo().should.be.equal('delegated undo 2');
      undoManager.undo().should.be.equal('delegated undo 1');
      undoManager.undo().should.be.equal('delegated undo 0');
      undoManager.undo().should.be.equal('undo a composed action(second sub action,first sub action)');
      undoManager.redo().should.be.equal('redo a composed action(first sub action,second sub action)');
      undoManager.redo().should.be.equal('delegated redo 0');
      undoManager.redo().should.be.equal('delegated redo 1');
      undoManager.redo().should.be.equal('delegated redo 2');
      undoManager.redo().should.be.equal('delegated redo 3');
      should.equal(undoManager.redo(),undefined);
    })
  })
});

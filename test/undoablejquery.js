// test for undoablejquery.js
//
/////////////////////////////////////////////////////////////////////////////////////////
'use strict';


if (!process.browser) {
  require('should');
  var UndoManager = require('../js/nestedundomanager');
  require('../js/undoablejquery');
}

let undoManager;

describe('undoablejquery.js', function () {
  it('$ will not work until you setUndoManager', function () {
    (function () {
      $('<div>test</div>').undoableAddClass('toto')
    }).should.throw('please set $.setUndoManager');
  });
  it('$ will work if you setUndoManager ', function () {
    undoManager = new UndoManager('main');
    $.setUndoManager(undoManager);
  });
  describe('undoableAddClass', function () {
    let e$ = $('<div>test</div><div class="alert">alert</div>');
    e$.length.should.be.equal(2);
    it('must add the class only where it is not already', function () {
      e$.undoableAddClass('alert');
      $(e$[0]).hasClass('alert').should.be.true();
      $(e$[1]).hasClass('alert').should.be.true();
      undoManager.undo().should.be.equal('undo add class alert');
      $(e$[0]).hasClass('alert').should.be.false();
      $(e$[1]).hasClass('alert').should.be.true();
      undoManager.redo().should.be.equal('redo add class alert');
      $(e$[0]).hasClass('alert').should.be.true();
      $(e$[1]).hasClass('alert').should.be.true();
    });
  });
  describe('undoableRemoveClass', function () {
    let e$ = $('<div>test</div><span class="alert">alert</span>');
    e$.length.should.be.equal(2);
    it('must remove the class only where it is already', function () {
      e$.undoableRemoveClass('alert');
      $(e$[0]).hasClass('alert').should.be.false();
      $(e$[1]).hasClass('alert').should.be.false();
      undoManager.undo().should.be.equal('undo remove class alert');
      $(e$[0]).hasClass('alert').should.be.false();
      $(e$[1]).hasClass('alert').should.be.true();
      undoManager.redo().should.be.equal('redo remove class alert');
      $(e$[0]).hasClass('alert').should.be.false();
      $(e$[1]).hasClass('alert').should.be.false();
    });
  });
  describe('undoableToggleClass', function () {
    let e$ = $('<div>test</div><span class="alert">alert</span>');
    e$.length.should.be.equal(2);
    it('if state = false act like undoableRemoveClass', function () {
      e$.undoableToggleClass('alert',false);
      $(e$[0]).hasClass('alert').should.be.false();
      $(e$[1]).hasClass('alert').should.be.false();
      undoManager.undo().should.be.equal('undo remove class alert');
      $(e$[0]).hasClass('alert').should.be.false();
      $(e$[1]).hasClass('alert').should.be.true();
      undoManager.redo().should.be.equal('redo remove class alert');
      $(e$[0]).hasClass('alert').should.be.false();
      $(e$[1]).hasClass('alert').should.be.false();
      undoManager.undo();
    });
    it('if state = is like undoableAddClass', function () {
      e$.undoableToggleClass('alert',true);
      $(e$[0]).hasClass('alert').should.be.true();
      $(e$[1]).hasClass('alert').should.be.true();
      undoManager.undo().should.be.equal('undo add class alert');
      $(e$[0]).hasClass('alert').should.be.false();
      $(e$[1]).hasClass('alert').should.be.true();
      undoManager.redo().should.be.equal('redo add class alert');
      $(e$[0]).hasClass('alert').should.be.true();
      $(e$[1]).hasClass('alert').should.be.true();
      undoManager.undo();
    });
    it('if state = undefined toggle the class', function () {
      e$.undoableToggleClass('alert');
      $(e$[0]).hasClass('alert').should.be.true();
      $(e$[1]).hasClass('alert').should.be.false();
      undoManager.undo().should.be.equal('undo toggle class alert');
      $(e$[0]).hasClass('alert').should.be.false();
      $(e$[1]).hasClass('alert').should.be.true();
      undoManager.redo().should.be.equal('redo toggle class alert');
      $(e$[0]).hasClass('alert').should.be.true();
      $(e$[1]).hasClass('alert').should.be.false();
      undoManager.undo();
    });
  });
  describe('undoableAttr', function () {
    let e$ = $('<div itemprop="e0">test</div>');
    it('can change the attribute only on one element', function () {
      e$.undoableAttr('itemprop', 'e1');
      e$.attr('itemprop').should.be.equal('e1');
      undoManager.undo().should.be.equal('undo set attribute itemprop to e1');
      e$.attr('itemprop').should.be.equal('e0');
      undoManager.redo().should.be.equal('redo set attribute itemprop to e1');
      e$.attr('itemprop').should.be.equal('e1');
    });
    it('will add an attribute if necessary and remove it on undo', function () {
      e$.undoableAttr('itemtype', 'myurl');
      e$.attr('itemtype').should.be.equal('myurl');
      undoManager.undo().should.be.equal('undo set attribute itemtype to myurl');
      should.equal(e$.attr('itemtype'), undefined);
    })
  });
  describe('undoableProp', function () {
    let e$ = $('<input type="checkbox" checked>');
    it('can change the property only on one element', function () {
      e$.undoableProp('checked', false);
      e$.prop('checked').should.be.false();
      undoManager.undo().should.be.equal('undo set property checked to false');
      e$.prop('checked').should.be.true();
      undoManager.redo().should.be.equal('redo set property checked to false');
      e$.prop('checked').should.be.false();
    });
    it('will add a property if necessary and remove it on undo', function () {
      e$.undoableProp('toto', '888');
      e$.prop('toto').should.be.equal('888');
      undoManager.undo().should.be.equal('undo set property toto to 888');
      should.equal(e$.prop('toto'), undefined);
    })
  });
  describe('undoableInsertBefore', function () {
    let e$ = $('<ul><li>line1</li><li>line2</li><li>line3</li></ul>');
    let lines$ = e$.children();
    it('move an element if already in the document: case last element', function () {
      $(lines$[2]).undoableInsertBefore($(lines$[0]));
      e$.html().should.be.equal('<li>line3</li><li>line1</li><li>line2</li>');
      undoManager.undo().should.be.equal('undo insert elements');
      e$.html().should.be.equal('<li>line1</li><li>line2</li><li>line3</li>');
      undoManager.redo().should.be.equal('redo insert elements');
      e$.html().should.be.equal('<li>line3</li><li>line1</li><li>line2</li>');
    });
    it('move an element if already in the document: case first element', function () {
      $(lines$[0]).undoableInsertBefore($(lines$[2]));
      e$.html().should.be.equal('<li>line1</li><li>line3</li><li>line2</li>');
      undoManager.undo().should.be.equal('undo insert elements');
      e$.html().should.be.equal('<li>line3</li><li>line1</li><li>line2</li>');
      undoManager.redo().should.be.equal('redo insert elements');
      e$.html().should.be.equal('<li>line1</li><li>line3</li><li>line2</li>');
    });
  });
  describe('undoableInsertAfter', function () {
    let e$ = $('<ul><li>line1</li><li>line2</li><li>line3</li></ul>');
    let lines$ = e$.children();
    it('move an element if already in the document: case first element', function () {
      $(lines$[0]).undoableInsertAfter($(lines$[2]));
      e$.html().should.be.equal('<li>line2</li><li>line3</li><li>line1</li>');
      undoManager.undo().should.be.equal('undo insert elements');
      e$.html().should.be.equal('<li>line1</li><li>line2</li><li>line3</li>');
      undoManager.redo().should.be.equal('redo insert elements');
      e$.html().should.be.equal('<li>line2</li><li>line3</li><li>line1</li>');
    });
    it('move an element if already in the document: last first element', function () {
      $(lines$[2]).undoableInsertAfter($(lines$[0]));
      e$.html().should.be.equal('<li>line2</li><li>line1</li><li>line3</li>');
      undoManager.undo().should.be.equal('undo insert elements');
      e$.html().should.be.equal('<li>line2</li><li>line3</li><li>line1</li>');
      undoManager.redo().should.be.equal('redo insert elements');
      e$.html().should.be.equal('<li>line2</li><li>line1</li><li>line3</li>');
    });
  });
});
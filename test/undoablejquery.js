// test for undoablejquery.js
//
/////////////////////////////////////////////////////////////////////////////////////////
'use strict';


if (!process.browser) {
  require('should');
  var UndoManager = require('../js/nestedundomanager');
  require('../js/undoablejquery');
}

describe('undoablejquery.js', function () {
  let undoManager = new UndoManager('main');
  $.setUndoManager(undoManager);

  describe('undoableAddClass', function () {
    let e$ = $('<div>test</div><div class="alert">alert</div>');
    e$.length.should.be.equal(2);
    it('must add the class only where it is not already', function () {
      e$.undoableAddClass('alert');
      $(e$[0]).hasClass('alert').should.be.true();
      $(e$[1]).hasClass('alert').should.be.true();
      undoManager.undo();
      $(e$[0]).hasClass('alert').should.be.false();
      $(e$[1]).hasClass('alert').should.be.true();

    });
  });
});
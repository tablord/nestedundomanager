'use strict';

if (!process.browser) {
    console.log('running in nodejs');
    require('./browserlike');
}

// JQuery extension for undoable actions

  $.setUndoManager = function(undoManager){
    $.undoManager = undoManager;
  };

  $.undoManager = {add:function(){throw Error('please set $.setUndoManager')}};

  $.fn.undoableAddClass = function (className) {
    // limited version of $.addClass, but that also register in undo the necessary object
    let elements$ = this.not('.' + className).addClass(className); // be sure to take only what will change
    $.undoManager.add({
      caption: 'add class '+className,
      undo: function () {
        elements$.removeClass(className)
      },  //thanks closures!!
      redo: function () {
        elements$.addClass(className)
      }
    });
    return this;
  };

  $.fn.undoableRemoveClass = function (className) {
    // limited version of $.removeClass, but that also register in undo the necessary object
    let elements$ = this.filter('.' + className).removeClass(className); // be sure to take only what will change
    $.undoManager.add({
      caption: 'remove class '+className,
      undo: function () {
        elements$.addClass(className)
      },  //thanks closures!!
      redo: function () {
        elements$.removeClass(className)
      }
    });
    return this;
  };

  $.fn.undoableToggleClass = function(className, state) {
    if (state === true) this.undoableAddClass(className);
    else if (state === false) this.undoableRemoveClass(className);
    else {
      let elements$ = this;
      elements$.toggleClass(className);
      $.undoManager.add({
        caption: 'toggle class ' + className,
        undo: function () {
          elements$.toggleClass(className)
        },
        redo: function () {
          elements$.toggleClass(className)
        }
      });
    }
  };

  $.fn.undoableAttr = function (attribute, value) {
    // limited version of $.attr(), but that also register in undo the necessary object
    // this must be a single element
    console.assert(this.length === 1, 'undoableAttr can operate only on single element');
    let element$ = this;
    let oldValue = element$.attr(attribute);
    element$.attr(attribute, value);
    $.undoManager.add({
      caption: 'set attribute '+attribute+' to '+value,
      undo: function () {
        if (oldValue === undefined) element$.removeAttr(attribute); else element$.attr(attribute, oldValue)
      },
      redo: function () {
        element$.attr(attribute, value)
      }
    });
    return element$;
  };

  $.fn.undoableProp = function (property, value) {
    // limited version of $.prop(), but that also register in undo the necessary object
    // this must be a single element
    console.assert(this.length === 1, 'undoableProp can operate only on single element');
    let element$ = this;
    let oldValue = element$.prop(property);
    element$.prop(property, value);
    $.undoManager.add({
      caption: 'set property '+property+' to '+value,
      undo: function () {
        if (oldValue === undefined) element$.removeProp(property); else element$.prop(property, oldValue);
      },
      redo: function () {
        element$.prop(property, value)
      }
    });
    return this;
  };

  $.fn.undoableInsertBefore = function (target$) {
    // same as $.insertBefore(target$) but can be undone

    this.each(function () {
      let element$ = $(this);
      let n$ = element$.next();
      if (n$.length) {
        $.undoManager.add({
          caption: 'insert elements',
          undo: function () {
            element$.insertBefore(n$)
          },
          redo: function () {
            element$.insertBefore(target$)
          }
        });
      } else { // no previous sibling ==> prepend to parent
        let p$ = element$.parent();
        $.undoManager.add({
          caption: 'insert elements',
          undo: function () {
            element$.appendTo(p$)
          },
          redo: function () {
            element$.insertBefore(target$)
          }
        });
      }
      element$.insertBefore(target$);
    });

  };

  $.fn.undoableInsertAfter = function (target$) {
    // same as $.insertAfter(target$) but can be undone

    this.each(function () {
      let element$ = $(this);
      let p$ = element$.prev();
      if (p$.length) {
        $.undoManager.add({
          caption: 'insert elements',
          undo: function () {
            element$.insertAfter(p$)
          },
          redo: function () {
            element$.insertAfter(target$)
          }
        });
      } else {// no previous sibling ==> prepend to parent
        let p$ = element$.parent();
        $.undoManager.add({
          caption: 'insert elements',
          undo: function () {
            element$.prependTo(p$)
          },
          redo: function () {
            element$.insertAfter(target$)
          }
        });
      }
      element$.insertAfter(target$);
    });
  };

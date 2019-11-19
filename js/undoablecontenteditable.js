// this module helps to undo redo elements that have contenteditable=true in order to undo redo any change in
// a global manner. The goal is to have a multitude of element that can have content editable and have a single
// consistent undoManager that will keep track of all.
//
// (CC-BY-SA 2019)Marc Nicole  according to https://creativecommons.org/
/////////////////////////////////////////////////////////////////////////////////
'use strict';

(function () {
  let ContentEditableObserverForUndoManager = function (globalUndoManager, config) {
    // create a new undoManager bridge:
    // - globalUndoManager must be an instance of UndoManager from nestedundomanager.
    // -config is the configuration of the internal MutationObserver that will keep track of the element
    // that is selected with .selectElement(element) method
    // by default config = {childList: true, characterData: true, characterDataOldValue: true, subtree: true}
    this.config = config || {childList: true, characterData: true, characterDataOldValue: true, subtree: true};
    let callbackThis = ContentEditableObserverForUndoManager.callback.bind(this);
    this.observer = new MutationObserver(callbackThis);
    this.globalUndoManager = globalUndoManager;
    let bridge = this;
    window.document.addEventListener('selectionchange', () => {
      bridge.previousSelection = $.extend({}, window.getSelection());
    });
  };

  ContentEditableObserverForUndoManager.debug = function(){};

  ContentEditableObserverForUndoManager.prototype.selectElement = function (element) {
    // select a new Element to be observed in order to populate the undoManager accordingly
    // - element: the element to be observed
    // - config: is optional the default is the config given at the creation of the ContentEditableObserverForUndoManager
    this.observer.disconnect();
    this.selectedElement = element;
    if (element === undefined) return;
    this.observer.observe(element, this.config);
  };

  ContentEditableObserverForUndoManager.setMutationNewValue = function (mutationList) {
    // for each characterData mutation, set an extra newValue field, with the current nodeValue, in order to have in during redo
    for (let i = 0; i < mutationList.length; i++) {
      let mutation = mutationList[i];
      if (mutation.type === 'characterData') {
        mutation.newValue = mutation.target.nodeValue;
      }
    }
  };

  ContentEditableObserverForUndoManager.undoMutations = function (mutationList) {
    for (let i = mutationList.length - 1; i >= 0; i--) {
      let mutation = mutationList[i];
      if (mutation.type === 'characterData') {
        ContentEditableObserverForUndoManager.debug('changed %s -> %s', mutation.target.nodeValue, mutation.oldValue);
        mutation.target.nodeValue = mutation.oldValue;
      } else if (mutation.type === 'childList') {
        if (mutation.addedNodes.length > 0) {
          ContentEditableObserverForUndoManager.debug('detach %d nodes', mutation.addedNodes.length);
          $(mutation.addedNodes).detach();
        }
        if (mutation.removedNodes.length > 0) {
          if (mutation.previousSibling) {
            $(mutation.removedNodes).insertAfter(mutation.previousSibling);
            ContentEditableObserverForUndoManager.debug('insert after %d nodes', mutation.removedNodes.length);
          } else if (mutation.nextSibling) {
            $(mutation.removedNodes).insertBefore(mutation.nextSibling);
            ContentEditableObserverForUndoManager.debug('insert before %d nodes', mutation.removedNodes.length);
          } else {
            $(mutation.target).append(mutation.removedNodes);
            ContentEditableObserverForUndoManager.debug('append %d nodes', mutation.removedNodes.length);
          }
        }
      } else {
        console.warn('mutation type %s not implemented yet', mutation.type);
      }
    }
  };

  ContentEditableObserverForUndoManager.redoMutations = function (mutationList) {
    for (let i = 0; i < mutationList.length; i++) {
      let mutation = mutationList[i];
      if (mutation.type === 'characterData') {
        ContentEditableObserverForUndoManager.debug('changed %s -> %s', mutation.target.nodeValue, mutation.newValue);
        mutation.target.nodeValue = mutation.newValue;
      } else if (mutation.type === 'childList') {
        if (mutation.removedNodes.length > 0) {
          ContentEditableObserverForUndoManager.debug('detach %d nodes', mutation.removedNodes.length);
          $(mutation.removedNodes).detach();
        }
        if (mutation.addedNodes.length > 0) {
          if (mutation.previousSibling) {
            $(mutation.addedNodes).insertAfter(mutation.previousSibling);
            ContentEditableObserverForUndoManager.debug('insert after %d nodes', mutation.addedNodes.length);
          } else if (mutation.nextSibling) {
            $(mutation.addedNodes).insertBefore(mutation.nextSibling);
            ContentEditableObserverForUndoManager.debug('insert before %d nodes', mutation.addedNodes.length);
          } else {
            $(mutation.target).append(mutation.addedNodes);
            ContentEditableObserverForUndoManager.debug('append %d nodes', mutation.addedNodes.length);
          }
        }
      } else {
        console.warn('mutation type %s not implemented yet', mutation.type);
      }
    }
  };


  ContentEditableObserverForUndoManager.callback = function (mutationList) {
    // the call back function for the internal observer: this represent the instance of
    // the ContentEditableObserverForUndoManager that bridges the element and the undoManager
    ContentEditableObserverForUndoManager.setMutationNewValue(mutationList);
    let bridge = this;
    let action = {
      caption: 'mutations(' + mutationList.length + ')',
      selectedElement: bridge.selectedElement,
      previousSelection: bridge.previousSelection,
      currentSelection: $.extend({}, window.getSelection()),
      undo: function () {
        bridge.observer.disconnect(); // no capture of the undo since will be put in redo
        ContentEditableObserverForUndoManager.undoMutations(mutationList);
        window.getSelection().collapse(this.previousSelection.focusNode, this.previousSelection.focusOffset);
        bridge.observer.observe(this.selectedElement, bridge.config);
      },
      redo: function () {
        bridge.observer.disconnect(); // no capture of the undo since will be put in redo
        ContentEditableObserverForUndoManager.redoMutations(mutationList);
        window.getSelection().collapse(this.currentSelection.focusNode, this.currentSelection.focusOffset);
        bridge.observer.observe(this.selectedElement, bridge.config);
      }
    };
    ContentEditableObserverForUndoManager.debug(action);
    bridge.globalUndoManager.add(action);

  };


  if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
    // AMD. Register as an anonymous module.
    /* istanbul ignore next */
    define(function () {
      return ContentEditableObserverForUndoManager;
    });
  } else if ((typeof process !== 'undefined') && !process.browser) {
    module.exports = ContentEditableObserverForUndoManager;
  } else {
    window.ContentEditableObserverForUndoManager = ContentEditableObserverForUndoManager;
  }

}());
// replacement for ace undo manager so that a global undo manager is used instead

function AceUndoManager(globalUndoManager) {
  // constructor for a Ace compatible undo manager that will
  // create actions in the global undo manager instead of using
  // the ace native undo manager
  this.globalUndoManager = globalUndoManager;
  this.session = undefined;

}

// implement dummy warning function for every method the original undoManager has
let umProto = ace.UndoManager.prototype;
for (let method in umProto){
  AceUndoManager.prototype[method] = function () {
    console.warn('unexpected call to '+method);
  };
}

AceUndoManager.prototype.addSession = function(session) {
  console.info('addSession');
  this.session = session;
};

AceUndoManager.prototype.addSelection = function(selection,rev) {
  console.info('add selection %s rev:%s',JSON.stringify(selection),rev);
};

AceUndoManager.prototype.add = function(delta,allowMerge){
  if (this.$fromUndo) {
    console.info('called from undo');
    return;
  }
  console.info('add(%s,%s)',JSON.stringify(delta),allowMerge);
  let session = this.session;
  let aceUndoManager = this;
  this.globalUndoManager.add({
    caption:'Ace edition',
    undo: function () {
      aceUndoManager.$fromUndo = true;
      if (delta.action === 'remove')  {
        let cursor = session.insert(delta.start,delta.lines.join('\n'));
        session.selection.setSelectionRange(new ace.Range(cursor.row,cursor.column,cursor.row,cursor.column),false);
      }
      else if (delta.action === 'insert') {
        let cursor = session.replace(new ace.Range(delta.start.row,delta.start.column,delta.end.row,delta.end.column),'');
        session.selection.setSelectionRange(new ace.Range(cursor.row,cursor.column,cursor.row,cursor.column),false);
      }
      else console.error('unknown action %s',delta.action);
      aceUndoManager.$fromUndo = false;
    },
    redo: function () {
      aceUndoManager.$fromUndo = true;
      if (delta.action === 'insert')  {
        let cursor = session.insert(delta.start,delta.lines.join('\n'));
        session.selection.setSelectionRange(new ace.Range(cursor.row,cursor.column,cursor.row,cursor.column),false);
      }
      else if (delta.action === 'remove') {
        let cursor = session.replace(new ace.Range(delta.start.row,delta.start.column,delta.end.row,delta.end.column),'');
        session.selection.setSelectionRange(new ace.Range(cursor.row,cursor.column,cursor.row,cursor.column),false);
      }
      else console.error('unknown action %s',delta.action);
      aceUndoManager.$fromUndo = false;
    },
  });

  AceUndoManager.prototype.undo = function () {
    this.globalUndoManager.undo();
  };

  AceUndoManager.prototype.redo = function() {
    this.globalUndoManager.redo();
  }

};


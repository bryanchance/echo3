/**
 * Component rendering peer: Row
 */
EchoRender.ComponentSync.Row = function() {
};
  
EchoRender.ComponentSync.Row.prototype = new EchoRender.ComponentSync;

EchoRender.ComponentSync.Row.prototype.getContainerElement = function(component) {
    return document.getElementById(this.component.renderId + "_" + component.renderId);
};

EchoRender.ComponentSync.Row.prototype.processKeyDown = function(e) { 
    switch (e.keyCode) {
    case 37:
        var focusChanged = EchoRender.Focus.visitNextFocusComponent(this.component, true);
        if (focusChanged) {
            // Prevent default action (vertical scrolling).
            EchoWebCore.DOM.preventEventDefault(e);
        }
        return !focusChanged;
    case 39:
        var focusChanged = EchoRender.Focus.visitNextFocusComponent(this.component, false);
        if (focusChanged) {
            // Prevent default action (vertical scrolling).
            EchoWebCore.DOM.preventEventDefault(e);
        }
        return !focusChanged;
    }
};

EchoRender.ComponentSync.Row.prototype.renderAdd = function(update, parentElement) {
    this.cellSpacing = EchoRender.Property.Extent.toPixels(this.component.getRenderProperty("cellSpacing"), false);
    var insets = this.component.getRenderProperty("insets");

    var tableElement = document.createElement("table");
    tableElement.id = this.component.renderId;
    tableElement.style.borderCollapse = "collapse";
    tableElement.style.outlineStyle = "none";
    tableElement.tabIndex = "-1";
    EchoRender.Property.Color.renderFB(this.component, tableElement);
    EchoRender.Property.Insets.renderComponentProperty(this.component, "insets", null, tableElement, "padding");

    var tbodyElement = document.createElement("tbody");
    tableElement.appendChild(tbodyElement);
    var trElement = document.createElement("tr");
    tbodyElement.appendChild(trElement);
    
    var componentCount = this.component.getComponentCount();
    for (var i = 0; i < componentCount; ++i) {
        var child = this.component.getComponent(i);
        this._renderAddChild(update, child, trElement);
    }
    
    EchoWebCore.EventProcessor.add(tableElement, "keydown", new EchoCore.MethodRef(this, this.processKeyDown), false);
    
    parentElement.appendChild(tableElement);
};

EchoRender.ComponentSync.Row.prototype._renderAddChild = function(update, child, parentElement, index) {
    if (index != null && index == update.parent.getComponentCount() - 1) {
        index = null;
    }
    
    var tdElement = document.createElement("td");
    tdElement.id = this.component.renderId + "_"+ child.renderId;
    EchoRender.renderComponentAdd(update, child, tdElement);

    var layoutData = child.getRenderProperty("layoutData");
    if (layoutData) {
        EchoRender.Property.Color.renderComponentProperty(layoutData, "background", null, tdElement, "backgroundColor");
        EchoRender.Property.FillImage.renderComponentProperty(layoutData, "backgroundImage", null, tdElement);
        EchoRender.Property.Insets.renderComponentProperty(layoutData, "insets", null, tdElement, "padding");
    }
    
    if (index == null) {
        // Full render or append-at-end scenario
        
        // Render spacing td first if index != 0 and cell spacing enabled.
        if (this.cellSpacing && parentElement.childNodes.length > 0) {
            var spacingTdElement = document.createElement("td");
            spacingTdElement.style.width = this.cellSpacing + "px";
            parentElement.appendChild(spacingTdElement);
        }

        // Render child td second.
        parentElement.appendChild(tdElement);
    } else {
        // Partial render insert at arbitrary location scenario (but not at end)
        var insertionIndex = this.cellSpacing ? index * 2 : index;
        var beforeElement = parentElement.childNodes[insertionIndex]
        
        // Render child td first.
        parentElement.insertBefore(tdElement, beforeElement);
        
        // Then render spacing td if required.
        if (this.cellSpacing) {
            var spacingTdElement = document.createElement("td");
            spacingTdElement.style.height = this.cellSpacing + "px";
            parentElement.insertBefore(spacingTdElement, beforeElement);
        }
    }
};

EchoRender.ComponentSync.Row.prototype._renderRemoveChild = function(update, child) {
    var childElement = document.getElementById(this.component.renderId + "_" + child.renderId);
    var parentElement = childElement.parentNode;
    if (this.cellSpacing) {
        // If cell spacing is enabled, remove a spacing element, either before or after the removed child.
        // In the case of a single child existing in the Row, no spacing element will be removed.
        if (childElement.previousSibling) {
            parentElement.removeChild(childElement.previousSibling);
        } else if (childElement.nextSibling) {
            parentElement.removeChild(childElement.nextSibling);
        }
    }
    parentElement.removeChild(childElement);
};

EchoRender.ComponentSync.Row.prototype.renderDispose = function(update) { 
    var tableElement = document.getElementById(this.component.renderId);
    EchoWebCore.EventProcessor.remove(tableElement, "keydown", new EchoCore.MethodRef(this, this.processKeyDown), false);
};

EchoRender.ComponentSync.Row.prototype.renderUpdate = function(update) {
    var fullRender = false;
    if (update.hasUpdatedProperties() || update.hasUpdatedLayoutDataChildren()) {
        // Full render
        fullRender = true;
    } else {
        var parentElement = document.getElementById(this.component.renderId);
        
        if (update.hasRemovedChildren()) {
            // Remove children.
            var removedChildren = update.getRemovedChildren();
            var length = removedChildren.size();
            for (var i = 0; i < length; ++i) {
                var child = removedChildren.items[i];
                this._renderRemoveChild(update, child);
            }
        }
        if (update.hasAddedChildren()) {
            // Add children.
            var addedChildren = update.getAddedChildren();
            var length = addedChildren.size();
            for (var i = 0; i < length; ++i) {
                var child = addedChildren.items[i];
                var index = this.component.indexOf(child);
                this._renderAddChild(update, child, parentElement, index); 
            }
        }
    }
    if (fullRender) {
        EchoRender.Util.renderRemove(update, update.parent);
        var containerElement = EchoRender.Util.getContainerElement(update.parent);
        this.renderAdd(update, containerElement);
    }
    
    return fullRender;
};

EchoRender.registerPeer("Row", EchoRender.ComponentSync.Row);
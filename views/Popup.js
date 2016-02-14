function Popup() {
    BaseTemplatedWidget.call(this);

    Popup.tryRegisterCloseHandlers();

    this.popupContainer.style.position = "absolute";
    this.popupContainer.style.left = "0px";
    this.popupContainer.style.top = "0px";
    this.hide();
}
__extend(BaseTemplatedWidget, Popup);
Popup.Z_INDEX = 9001;
Popup.tryRegisterCloseHandlers = function () {
    if (Popup.closeHandlersRegistered) return;

    document.body.addEventListener("mousedown", function (event) {
        if (Popup.stack.length == 0) return;
        var popup = Popup.stack[Popup.stack.length - 1];
        popup.closeUpward(event);
    }, false);

    Popup.closeHandlersRegistered = true;
};
Popup.stack = [];
Popup.prototype.closeUpward = function (event) {
    var thiz = this;
    var node = Dom.findUpward(event.target, function (n) {
        return n == thiz.popupContainer;
    });

    if (node) return;
    if (this.dontCloseUpward && this.dontCloseUpward(event)) return;
    this.hide();
    Popup.stack.pop();
    event.preventDefault();

    if (this._parent) this._parent.closeUpward(event);
};
Popup.prototype.checkToCloseParent = function (element) {
    var thiz = this;
    var handler = function (popup) {
        if (!popup._parent) return;

        var node = Dom.findUpward(element, function (n) {
            return n == popup._parent.popupContainer;
        });

        if (node) {
            popup._parent._keepShowing = true;
        } else {
            popup._parent._keepShowing = false;
        }

        handler(popup._parent);
    };

    handler(this);
};
Popup.prototype.setContentFragment = function (fragment) {
    this.popupContainer.appendChild(fragment);
};
Popup.prototype.show = function (anchor, hAlign, vAlign, hPadding, vPadding, autoFlip) {
    this.popupContainer.parentNode.removeChild(this.popupContainer);
    this.node().ownerDocument.body.appendChild(this.popupContainer);
    if (this.mode) {
        this.popupContainer.setAttribute("mode", this.mode);
    }
    this.popupContainer.style.left = "0px";
    this.popupContainer.style.top = "0px";

    this.popupContainer.style.visibility = "hidden";
    this.popupContainer.style.display = "block";
    this.popupContainer.style.height = "auto";
    this.popupContainer.style.overflow = "visible";

    var thiz = this;
    window.setTimeout(function () {
        thiz._showImpl(anchor, hAlign, vAlign, hPadding, vPadding, autoFlip);
    }, 10);
};
Popup.prototype.showAt = function (x, y) {
    this.popupContainer.parentNode.removeChild(this.popupContainer);
    this.node().ownerDocument.body.appendChild(this.popupContainer);
    if (this.mode) {
        this.popupContainer.setAttribute("mode", this.mode);
    }

    this.popupContainer.style.visibility = "hidden";
    this.popupContainer.style.display = "block";

    var w = this.popupContainer.offsetWidth;
    var h = this.popupContainer.offsetHeight;


    var screenW = document.body.offsetWidth - 10;
    var screenH = window.innerHeight - 10;

    console.log(x, y, w, h, screenW, screenH);

    if (y + h > screenH) {
        y = screenH - h;
    }

    if (x + w > screenW) {
        x = x - w;
    }

    this.popupContainer.style.position = "absolute";
    this.popupContainer.style.left = x + "px";
    this.popupContainer.style.top = y + "px";
    this.popupContainer.style.zIndex = Popup.Z_INDEX;
    this.popupContainer.style.visibility = "visible";
    this.popupContainer.style.opacity = 1;

    Popup.stack.push(this);
};
Popup.prototype._calculatePosition = function (anchor, hAlign, vAlign, hPadding, vPadding) {
    var w = this.popupContainer.offsetWidth;
    var h = this.popupContainer.offsetHeight;

    rect = anchor.getBoundingClientRect();
    var aw = rect.width;
    var ah = rect.height;
    var ax = rect.left;
    var ay = rect.top;

    var p = hPadding || 0;

    var x = 0;
    if (hAlign == "left") x = ax - w - p;
    if (hAlign == "left-inside") x = ax + p;
    if (hAlign == "middle" || hAlign == "center") x = ax + aw / 2 - w / 2;
    if (hAlign == "right") x = ax + aw + p;
    if (hAlign == "right-inside") x = ax + aw - w - p;

    p = vPadding || p;

    var y = 0;
    if (vAlign == "top") y = ay - h - p;
    if (vAlign == "top-inside") y = ay + p;
    if (vAlign == "middle" || vAlign == "center") y = ay + ah / 2 - h / 2;
    if (vAlign == "bottom") y = ay + ah + p;
    if (vAlign == "bottom-inside") y = ay + ah - h - p;

    return{x: x, y: y};
};
Popup.prototype._showImpl = function (anchor, hAlign, vAlign, hPadding, vPadding, autoFlip) {
    var w = this.popupContainer.offsetWidth;
    var h = this.popupContainer.offsetHeight;

    var p = this._calculatePosition(anchor, hAlign, vAlign, hPadding, vPadding);
    var x = p.x;
    var y = p.y;

    //invalidate into view
    var screenW = document.body.offsetWidth - 10;
    console.log("Location", x, w, screenW);``
    if (x + w > screenW) {
        if (autoFlip && (hAlign == "right" || hAlign == "left-inside")) {
            p = this._calculatePosition(anchor, hAlign == "right" ? "left" : "right-inside", vAlign, hPadding, vPadding);
            x = p.x;
        } else {
            x = screenW - w;
        }
    }
    var screenH = window.innerHeight - 10;
    if (y + h > screenH) {
        var fixedY = false;
        if (autoFlip && (vAlign == "bottom" || vAlign == "top-inside")) {
            p = this._calculatePosition(anchor, hAlign, vAlign == "bottom" ? "top" : "bottom-inside", hPadding, vPadding);
            y = p.y;
        } else {
            this.popupContainer.style.height = (screenH - y) + "px";
            this.popupContainer.style.overflow = "auto";
        }
    }

    this.popupContainer.style.position = "absolute";
    this.popupContainer.style.left = x + "px";
    this.popupContainer.style.top = y + "px";
    this.popupContainer.style.zIndex = Popup.Z_INDEX;
    this.popupContainer.style.visibility = "visible";
    this.popupContainer.style.display = "block";
    this.popupContainer.style.opacity = 1;

    Dom.emitEvent("p:PopupShown", this.node());

    Popup.stack.push(this);
};
Popup.prototype.hide = function (silent) {
    this.popupContainer.style.display = "none";
    this.popupContainer.style.opacity = 0;
    this.popupContainer.style.visibility = "hidden";
    if (!silent) Dom.emitEvent("p:PopupHidden", this.node());
    if (this.onHide) this.onHide();
    // if (this._parent) {
    //     if (!this._parent._keepShowing) {
    //        this._parent.hide();
    //    } else {
    //        this._parent._keepShowing = false;
    //    }
    // }
};
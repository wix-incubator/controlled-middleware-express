const assert = require('assert');

class ControlledMiddleware {
  _activatedMW = (req, res, next) => this._middlewareHandlerFn(req, res, next)
  _deactivatedMW = (req, res, next) => next()
  _wrapper = (req, res, next) => this._currentMW(req, res, next)

  express() {
    return this._wrapper;
  }

  constructor(middlewareHandlerFn) {
    this.setHandler(middlewareHandlerFn);
    this.deactivate();
  }

  activate() {
    this._currentMW = this._activatedMW;
    return this;
  }

  deactivate() {
    this._currentMW = this._deactivatedMW;
    return this;
  }

  setHandler(middlewareHandlerFn) {
    assert(typeof middlewareHandlerFn === 'function', 'Argument must be a function.');
    this._middlewareHandlerFn = middlewareHandlerFn;
    return this;
  }

  getHandler() {
    return this._middlewareHandlerFn;
  }
}

module.exports.ControlledMiddleware = ControlledMiddleware;

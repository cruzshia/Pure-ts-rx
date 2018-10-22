'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('mz/fs');

const sendToPast = (fileName, bypass) => {
    if (bypass) return Promise.resolve();
    return fs.utimes(fileName, new Date(Date.now() - 10000), new Date(Date.now() - 10000));
};

const promiseCall = (fn, ...args) => new Promise((resolve, reject) => fn(...args, (err, result) => err ? reject(err) : resolve(result)));

const writeFileR = (() => {
    var _ref = _asyncToGenerator(function* (...args) {
        const fileName = args[0];
        yield promiseCall(mkdirp, path.dirname(fileName));
        return fs.writeFile(...args);
    });

    return function writeFileR() {
        return _ref.apply(this, arguments);
    };
})();

module.exports = {
    sendToPast,
    promiseCall,
    writeFileR
};
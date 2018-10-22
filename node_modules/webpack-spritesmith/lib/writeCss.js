'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const spritesheetTemplater = require('spritesheet-templates');

var _require = require('./utils');

const sendToPast = _require.sendToPast,
      writeFileR = _require.writeFileR;


module.exports = (() => {
        var _ref = _asyncToGenerator(function* (sources, templaterData, shouldSendToPast) {
                return yield Promise.all(sources.map((() => {
                        var _ref2 = _asyncToGenerator(function* (css) {
                                const fileName = css[0];

                                const code = spritesheetTemplater(templaterData, css[1]);

                                yield writeFileR(fileName, code);
                                yield sendToPast(fileName, !shouldSendToPast);

                                return fileName;
                        });

                        return function (_x4) {
                                return _ref2.apply(this, arguments);
                        };
                })()));
        });

        return function (_x, _x2, _x3) {
                return _ref.apply(this, arguments);
        };
})();
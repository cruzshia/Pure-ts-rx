'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const path = require('path');
const Spritesmith = require('spritesmith');
const _ = require('lodash');

const substitute = require('./substitute');
const writeCss = require('./writeCss');

var _require = require('./utils');

const sendToPast = _require.sendToPast,
      promiseCall = _require.promiseCall,
      writeFileR = _require.writeFileR;


module.exports = (() => {
    var _ref = _asyncToGenerator(function* (options, metaOutput, isInitial, srcFiles) {
        const spritesmithResult = yield promiseCall(Spritesmith.run.bind(Spritesmith), _extends({}, options.spritesmithOptions, {
            src: srcFiles.map(function (fileName) {
                return path.resolve(options.src.cwd, fileName);
            })
        }));

        const imageNameWithSubstitutions = substitute(options.target.image, spritesmithResult);
        const willWriteCss = writeCss(options.target.css, toSpritesheetTemplatesFormat(spritesmithResult), isInitial);

        yield writeFileR(imageNameWithSubstitutions, spritesmithResult.image, 'binary');
        yield sendToPast(imageNameWithSubstitutions, !isInitial);

        return {
            css: yield willWriteCss,
            images: [imageNameWithSubstitutions]
        };

        function toSpritesheetTemplatesFormat(spritesmithResult) {
            const generateSpriteName = options.apiOptions.generateSpriteName;
            const sprites = _.map(spritesmithResult.coordinates, (oneSourceInfo, fileName) => _extends({}, oneSourceInfo, {
                name: generateSpriteName(fileName),
                source_image: fileName
            }));

            const imageRefWithSubstitutions = substitute(options.apiOptions.cssImageRef, spritesmithResult);
            const spritesheet = _extends({
                image: imageRefWithSubstitutions
            }, spritesmithResult.properties);

            return { sprites, spritesheet };
        }
    });

    return function (_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
    };
})();
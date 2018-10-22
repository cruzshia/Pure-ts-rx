'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const Spritesmith = require('spritesmith');
const path = require('path');
const _ = require('lodash');

const substitute = require('./substitute');
const writeCss = require('./writeCss');

var _require = require('./utils');

const sendToPast = _require.sendToPast,
      promiseCall = _require.promiseCall,
      writeFileR = _require.writeFileR;


module.exports = (() => {
    var _ref = _asyncToGenerator(function* (options, metaOutput, isInitial, srcFiles) {
        const sourceRecords = srcFiles.map(function (fileName) {
            const oneRecord = options.retina.classifier(path.resolve(options.src.cwd, fileName));
            return _extends({}, oneRecord, {
                apiName: options.apiOptions.generateSpriteName(oneRecord.normalName)
            });
        });

        const combinedSources = _.map(_.groupBy(sourceRecords, 'apiName'), function (group) {
            const result = _.clone(group[0]);
            group.forEach(function (oneRecord) {
                result[oneRecord.type] = true;
            });
            return result;
        });

        const errors = checkMissingImages();
        if (errors.length !== 0) {
            metaOutput.errors.push(...errors);
            return null;
        }

        const results = yield Promise.all([promiseCall(Spritesmith.run.bind(Spritesmith), _extends({}, options.spritesmithOptions, {
            src: _.map(combinedSources, 'normalName')
        })), promiseCall(Spritesmith.run.bind(Spritesmith), _extends({}, options.spritesmithOptions, {
            src: _.map(combinedSources, 'retinaName'),
            padding: (options.spritesmithOptions.padding || 0) * 2
        }))]);

        combinedSources.forEach(function (oneSource) {
            oneSource.normalCoordinates = results[0].coordinates[oneSource.normalName];
            oneSource.retinaCoordinates = results[1].coordinates[oneSource.retinaName];
        });

        const normalSprites = getSpritesForSpritesheetTemplates('', 'normalCoordinates', 'normalName');
        const retinaSprites = getSpritesForSpritesheetTemplates('retina_', 'retinaCoordinates', 'retinaName');

        const spritesheetTemplatesData = {
            sprites: normalSprites,
            spritesheet: {
                width: results[0].properties.width,
                height: results[0].properties.height,
                image: substitute(options.apiOptions.cssImageRef, results[0])
            },
            retina_sprites: retinaSprites,
            retina_spritesheet: {
                width: results[1].properties.width,
                height: results[1].properties.height,
                image: substitute(options.retina.cssImageRef, results[1])
            },
            retina_groups: combinedSources.map(function (sprite, i) {
                return {
                    name: sprite.apiName,
                    index: i
                };
            })
        };

        const normalImageName = substitute(options.target.image, results[0]);
        const retinaImageName = substitute(options.retina.targetImage, results[1]);

        const writeImage = (() => {
            var _ref2 = _asyncToGenerator(function* (fileName, buffer, isInitial) {
                yield writeFileR(fileName, buffer, 'binary');
                yield sendToPast(fileName, !isInitial);
            });

            return function writeImage(_x5, _x6, _x7) {
                return _ref2.apply(this, arguments);
            };
        })();

        const willWriteCss = writeCss(options.target.css, spritesheetTemplatesData, isInitial);
        yield writeImage(normalImageName, results[0].image, isInitial);
        yield writeImage(retinaImageName, results[1].image, isInitial);

        return {
            css: yield willWriteCss,
            images: [normalImageName, retinaImageName]
        };

        function getSpritesForSpritesheetTemplates(prefix, field, sourceField) {
            return _.map(combinedSources, sprite => ({
                name: prefix + sprite.apiName,
                source_image: sprite[sourceField],
                x: sprite[field].x,
                y: sprite[field].y,
                width: sprite[field].width,
                height: sprite[field].height
            }));
        }

        function checkMissingImages() {
            const errors = [];
            _.forEach(combinedSources, group => {
                if (group.retina && !group.normal) {
                    errors.push(new Error('webpack-spritesmith: no normal source for sprite "' + group.apiName + '" expected file name is ' + group.normalName));
                }
                if (!group.retina && group.normal) {
                    errors.push(new Error('webpack-spritesmith: no retina source for sprite "' + group.apiName + '" expected file name is ' + group.retinaName));
                }
            });
            return errors;
        }
    });

    return function (_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
    };
})();
'use strict';
var multiItemSlider = (function () {

    function _isElementVisible(element) {
        var rect = element.getBoundingClientRect(),
            vWidth = window.innerWidth || doc.documentElement.clientWidth,
            vHeight = window.innerHeight || doc.documentElement.clientHeight,
            elemFromPoint = function (x, y) { return document.elementFromPoint(x, y) };
        if (rect.right < 0 || rect.bottom < 0
            || rect.left > vWidth || rect.top > vHeight)
            return false;
        return (
            element.contains(elemFromPoint(rect.left, rect.top))
            || element.contains(elemFromPoint(rect.right, rect.top))
            || element.contains(elemFromPoint(rect.right, rect.bottom))
            || element.contains(elemFromPoint(rect.left, rect.bottom))
        );
    }

    return function (selector, config) {
        var
            _mainElement = document.querySelector(selector),

            _sliderWrapper = _mainElement.querySelector(selector + '__wrapper'),
            _sliderItems = _mainElement.querySelectorAll(selector + '__item'),
            _sliderControls = _mainElement.querySelectorAll(selector + '__control'),
            _sliderControlLeft = _mainElement.querySelector(selector + '__control_left'),
            _sliderControlRight = _mainElement.querySelector(selector + '__control_right'),
            _wrapperWidth = parseFloat(getComputedStyle(_sliderWrapper).width),
            _itemWidth = parseFloat(getComputedStyle(_sliderItems[0]).width),
            _html = _mainElement.innerHTML,
            _indexIndicator = 0,
            _maxIndexIndicator = _sliderItems.length - 1,
            _indicatorItems,
            _indicatorNavbarItems,
            _positionLeftItem = 0,
            _transform = 0,
            _step = _itemWidth / _wrapperWidth * 100,
            _items = [],
            _interval = 0,
            _states = [
                { active: false, minWidth: 0, count: 1 },
                { active: false, minWidth: 576, count: 2 },
                { active: false, minWidth: 992, count: 3 },
                { active: false, minWidth: 1200, count: 4 },
            ],
            _config = {
                isCycling: false,
                direction: 'right',
                interval: 5000,
                pause: true
            };

        for (var key in config) {
            if (key in _config) {
                _config[key] = config[key];
            }
        }

        _sliderItems.forEach(function (item, index) {
            _items.push({ item: item, position: index, transform: 0 });
        });

        var _setActive = function () {
            var _index = 0;
            var width = parseFloat(document.body.clientWidth);
            _states.forEach(function (item, index, arr) {
                _states[index].active = false;
                if (width >= _states[index].minWidth)
                    _index = index;
            });
            _states[_index].active = true;
        }

        var _getActive = function () {
            var _index;
            _states.forEach(function (item, index, arr) {
                if (_states[index].active) {
                    _index = index;
                }
            });
            return _index;
        }

        var position = {
            getItemMin: function () {
                var indexItem = 0;
                _items.forEach(function (item, index) {
                    if (item.position < _items[indexItem].position) {
                        indexItem = index;
                    }
                });
                return indexItem;
            },
            getItemMax: function () {
                var indexItem = 0;
                _items.forEach(function (item, index) {
                    if (item.position > _items[indexItem].position) {
                        indexItem = index;
                    }
                });
                return indexItem;
            },
            getMin: function () {
                return _items[position.getItemMin()].position;
            },
            getMax: function () {
                return _items[position.getItemMax()].position;
            }
        }

        var _transformItem = function (direction) {
            var nextItem, currentIndicator = _indexIndicator;

            if (direction === 'right') {
                _positionLeftItem++;
                if ((_positionLeftItem + _wrapperWidth / _itemWidth - 1) > position.getMax()) {
                    nextItem = position.getItemMin();
                    _items[nextItem].position = position.getMax() + 1;
                    _items[nextItem].transform += _items.length * 100;
                    _items[nextItem].item.style.transform = 'translateX(' + _items[nextItem].transform + '%)';
                }
                _transform -= _step;
                _indexIndicator = _indexIndicator + 1;
                if (_indexIndicator > _maxIndexIndicator) {
                    _indexIndicator = 0;
                }
            }
            if (direction === 'left') {
                _positionLeftItem--;
                if (_positionLeftItem < position.getMin()) {
                    nextItem = position.getItemMax();
                    _items[nextItem].position = position.getMin() - 1;
                    _items[nextItem].transform -= _items.length * 100;
                    _items[nextItem].item.style.transform = 'translateX(' + _items[nextItem].transform + '%)';
                }
                _transform += _step;
                _indexIndicator = _indexIndicator - 1;
                if (_indexIndicator < 0) {
                    _indexIndicator = _maxIndexIndicator;
                }
            }
            _sliderWrapper.style.transform = 'translateX(' + _transform + '%)';
            if (config.indicators) {
                _indicatorItems[currentIndicator].classList.remove('active');
                _indicatorItems[_indexIndicator].classList.add('active');
                if (config.navbarIndicators) {
                    _indicatorNavbarItems[currentIndicator].classList.remove((selector + '-active').slice(1));
                    _indicatorNavbarItems[_indexIndicator].classList.add((selector + '-active').slice(1));
                }
            }

        }

        var _slideTo = function (to) {
            var i = 0, direction = (to > _indexIndicator) ? 'right' : 'left';
            while (to !== _indexIndicator && i <= _maxIndexIndicator) {
                _transformItem(direction);
                i++;
            }
        }

        var _cycle = function (direction) {
            if (!_config.isCycling) {
                return;
            }
            _interval = setInterval(function () {
                _transformItem(direction);
            }, _config.interval);
        }

        var _controlClick = function (e) {
            e.preventDefault();
            if (e.target.classList.contains((selector + '__control').slice(1))) {
                var direction = e.target.classList.contains((selector + '__control_right').slice(1)) ? 'right' : 'left';
                _transformItem(direction);
                clearInterval(_interval);
                _cycle(_config.direction);
            }
            if (e.target.getAttribute('data-slide-to')) {
                _slideTo(parseInt(e.target.getAttribute('data-slide-to')));
                clearInterval(_interval);
                _cycle(_config.direction);
            }
        };

        var _handleVisibilityChange = function () {
            if (document.visibilityState === "hidden") {
                clearInterval(_interval);
            } else {
                clearInterval(_interval);
                _cycle(_config.direction);
            }
        }

        var _refresh = function () {
            clearInterval(_interval);
            _mainElement.innerHTML = _html;
            _sliderWrapper = _mainElement.querySelector(selector + '__wrapper');
            _sliderItems = _mainElement.querySelectorAll(selector + '__item');
            _sliderControls = _mainElement.querySelectorAll(selector + '__control');
            _sliderControlLeft = _mainElement.querySelector(selector + '__control_left');
            _sliderControlRight = _mainElement.querySelector(selector + '__control_right');
            _wrapperWidth = parseFloat(getComputedStyle(_sliderWrapper).width);
            _itemWidth = parseFloat(getComputedStyle(_sliderItems[0]).width);
            _positionLeftItem = 0;
            _transform = 0;
            _indexIndicator = 0;
            _maxIndexIndicator = _sliderItems.length - 1;
            _step = _itemWidth / _wrapperWidth * 100;
            _items = [];
            _sliderItems.forEach(function (item, index) {
                _items.push({ item: item, position: index, transform: 0 });
            });
            if (config.indicators) {
                _addIndicators();
            }

        }

        var _setUpListeners = function () {
            _mainElement.addEventListener('click', _controlClick);
            if (_config.pause && _config.isCycling) {
                _mainElement.addEventListener('mouseenter', function () {
                    clearInterval(_interval);
                });
                _mainElement.addEventListener('mouseleave', function () {
                    clearInterval(_interval);
                    _cycle(_config.direction);
                });
            }

            document.addEventListener('visibilitychange', _handleVisibilityChange, false);
            window.addEventListener('resize', function () {
                var
                    _index = 0,
                    width = parseFloat(document.body.clientWidth);
                _states.forEach(function (item, index, arr) {
                    if (width >= _states[index].minWidth)
                        _index = index;
                });
                if (_index !== _getActive()) {
                    _setActive();
                    _refresh();
                }
            });

            //touch and mouse handle

            var startX = 0;
            var startY = 0;
            var distX = 0;
            var distY = 0;

            var startTime = 0;
            var elapsedTime = 0;

            var threshold = 150;
            var restraint = 100;
            var allowedTime = 300;

            _mainElement.addEventListener('mousedown', function (e) {
                startX = e.pageX;
                startY = e.pageY;
                startTime = new Date().getTime();
                e.preventDefault();
            });
            _mainElement.addEventListener('mouseup', function (e) {
                distX = e.pageX - startX;
                distY = e.pageY - startY;
                elapsedTime = new Date().getTime() - startTime;

                if (elapsedTime <= allowedTime) {
                    if (Math.abs(distX) >= threshold && Math.abs(distY) <= threshold) {
                        if (distX > 0) {
                            _transformItem('left');
                            clearInterval(_interval);
                            _cycle(_config.direction);
                        } else {
                            _transformItem('right');
                            clearInterval(_interval);
                            _cycle(_config.direction);
                        }
                    }
                }
            });

            _mainElement.addEventListener('touchstart', function (e) {
                if (e.target.classList.contains((selector + '__control').slice(1))) {
                    var direction = e.target.classList.contains((selector + '__control_right').slice(1)) ? 'right' : 'left';
                    _transformItem(direction);
                    clearInterval(_interval);
                    _cycle(_config.direction);
                }
                if (e.target.getAttribute('data-slide-to')) {
                    _slideTo(parseInt(e.target.getAttribute('data-slide-to')));
                    clearInterval(_interval);
                    _cycle(_config.direction);
                }
                var touchObj = e.changedTouches[0];
                startX = touchObj.pageX;
                startY = touchObj.pageY;
                startTime = new Date().getTime();
                e.preventDefault();
            });
            _mainElement.addEventListener('touchmove', function (e) {
                e.preventDefault();
            });
            _mainElement.addEventListener('touchend', function (e) {
                var touchObj = e.changedTouches[0];
                distX = touchObj.pageX - startX;
                distY = touchObj.pageY - startY;
                elapsedTime = new Date().getTime() - startTime;

                if (elapsedTime <= allowedTime) {
                    if (Math.abs(distX) >= threshold && Math.abs(distY) <= threshold) {
                        if (distX > 0) {
                            _transformItem('left');
                            clearInterval(_interval);
                            _cycle(_config.direction);
                        } else {
                            _transformItem('right');
                            clearInterval(_interval);
                            _cycle(_config.direction);
                        }
                    }
                }
            });

            //touch and mouse handle

        }

        var _addIndicators = function () {
            var container = document.querySelector(selector + '_indicators')
            var sliderIndicators = document.createElement('ol');
            sliderIndicators.classList.add('slider__indicators');
            for (var i = 0; i < _sliderItems.length; i++) {
                var sliderIndicatorsItem = document.createElement('li');
                if (i === 0) {
                    sliderIndicatorsItem.classList.add('active');
                }
                sliderIndicatorsItem.setAttribute("data-slide-to", i);
                sliderIndicators.appendChild(sliderIndicatorsItem);
            }
            container.appendChild(sliderIndicators);
            _indicatorItems = container.querySelectorAll('.slider__indicators > li');
            if (config.navbarIndicators) {
                _indicatorNavbarItems = document.querySelectorAll(selector + '-navbar > .indicator-item')

            }
        }

        // добавляем индикаторы
        if (config.indicators) {
            _addIndicators();
        }
        // инициализация
        _setUpListeners();

        if (document.visibilityState === "visible") {
            _cycle(_config.direction);
        }
        _setActive();

        return {
            right: function () {
                _transformItem('right');
            },
            left: function () {
                _transformItem('left');
            },
            stop: function () {
                _config.isCycling = false;
                clearInterval(_interval);
            },
            cycle: function () {
                _config.isCycling = true;
                clearInterval(_interval);
                _cycle();
            }
        }

    }
}());

// var slider = multiItemSlider('.slider_projects', {
//     isCycling: false,
//     indicators: true,
//     navbarIndicators: true
// });

// var slider2 = multiItemSlider('.slider_photos', {
//     isCycling: false,
//     indicators: false,
//     navbarIndicators: false
// });

// var slide3 = multiItemSlider('.slider-steps', {
//     isCycling: false,
//     indicators: true,
//     navbarIndicators: true
// })

document.addEventListener('DOMContentLoaded', function () {
    multiItemSlider('.slider_projects', {
        isCycling: false,
        indicators: true,
        navbarIndicators: true
    });
    multiItemSlider('.slider_photos', {
        isCycling: false,
        indicators: false,
        navbarIndicators: false
    });
    multiItemSlider('.slider-steps', {
        isCycling: false,
        indicators: true,
        navbarIndicators: true
    });
    multiItemSlider('.slider-gallery', {
        isCycling: false,
        indicators: false,
        navbarIndicators: false
    })
})
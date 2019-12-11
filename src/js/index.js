let multiItemSlider = (function () {

    function _isElementVisible(element) {
        let rect = element.getBoundingClientRect(),
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
        let
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

        for (let key in config) {
            if (key in _config) {
                _config[key] = config[key];
            }
        }

        _sliderItems.forEach(function (item, index) {
            _items.push({ item: item, position: index, transform: 0 });
        });

        let _setActive = function () {
            let _index = 0;
            let width = parseFloat(document.body.clientWidth);
            _states.forEach(function (item, index, arr) {
                _states[index].active = false;
                if (width >= _states[index].minWidth)
                    _index = index;
            });
            _states[_index].active = true;
        }

        let _getActive = function () {
            let _index;
            _states.forEach(function (item, index, arr) {
                if (_states[index].active) {
                    _index = index;
                }
            });
            return _index;
        }

        let position = {
            getItemMin: function () {
                let indexItem = 0;
                _items.forEach(function (item, index) {
                    if (item.position < _items[indexItem].position) {
                        indexItem = index;
                    }
                });
                return indexItem;
            },
            getItemMax: function () {
                let indexItem = 0;
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

        let _transformItem = function (direction) {
            let nextItem, currentIndicator = _indexIndicator;
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

        let _slideTo = function (to) {
            let i = 0, direction = (to > _indexIndicator) ? 'right' : 'left';
            while (to !== _indexIndicator && i <= _maxIndexIndicator) {
                _transformItem(direction);
                i++;
            }
        }

        let _cycle = function (direction) {
            if (!_config.isCycling) {
                return;
            }
            _interval = setInterval(function () {
                _transformItem(direction);
            }, _config.interval);
        }

        let _controlClick = function (e) {
            e.preventDefault();
            if (e.target.classList.contains((selector + '__control').slice(1))) {
                let direction = e.target.classList.contains((selector + '__control_right').slice(1)) ? 'right' : 'left';
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

        let _handleVisibilityChange = function () {
            if (document.visibilityState === "hidden") {
                clearInterval(_interval);
            } else {
                clearInterval(_interval);
                _cycle(_config.direction);
            }
        }

        let _refresh = function () {
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

        let _setUpListeners = function () {
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
                let
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

            let startX = 0;
            let startY = 0;
            let distX = 0;
            let distY = 0;

            let startTime = 0;
            let elapsedTime = 0;

            let threshold = 150;
            let restraint = 100;
            let allowedTime = 300;

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
                    let direction = e.target.classList.contains((selector + '__control_right').slice(1)) ? 'right' : 'left';
                    _transformItem(direction);
                    clearInterval(_interval);
                    _cycle(_config.direction);
                }
                if (e.target.getAttribute('data-slide-to')) {
                    _slideTo(parseInt(e.target.getAttribute('data-slide-to')));
                    clearInterval(_interval);
                    _cycle(_config.direction);
                }
                let touchObj = e.changedTouches[0];
                startX = touchObj.pageX;
                startY = touchObj.pageY;
                startTime = new Date().getTime();
                e.preventDefault();
            });
            _mainElement.addEventListener('touchmove', function (e) {
                e.preventDefault();
            });
            _mainElement.addEventListener('touchend', function (e) {
                let touchObj = e.changedTouches[0];
                distX = touchObj.pageX - startX;
                distY = touchObj.pageY - startY;

                elapsedTime = new Date().getTime() - startTime;
                if (distX === 0 && distY === 0) {
                    if(e.target.id === 'first') {
                        frame = document.getElementById('theyalow');
                        toProject(frame);
                    }
                    if(e.target.id === 'second') {
                        frame = document.getElementById('repair');
                        toProject(frame);
                    }
                }
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

        let _addIndicators = function () {
            let container = document.querySelector(selector + '_indicators')
            let sliderIndicators = document.createElement('ol');
            sliderIndicators.classList.add('slider__indicators');
            for (let i = 0; i < _sliderItems.length; i++) {
                let sliderIndicatorsItem = document.createElement('li');
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

document.addEventListener('DOMContentLoaded', function () {
    multiItemSlider('.slider', {
        isCycling: false,
        indicators: false,
        navbarIndicators: false
    });
})

// let slider = multiItemSlider('.slider');
let down = true;
let desk = true;

// document.querySelectorAll('.slider-button').forEach((item) => {
//     item.addEventListener('click', function () {
//         console.log('click')
//         if (desk) {
//             document.querySelectorAll('.description').forEach((item) => {
//                 item.classList.add('desk-active')
//             })
//             desk = !desk;
//         } else {
//             document.querySelectorAll('.description').forEach((item) => {
//                 item.classList.remove('desk-active')
//             })
//             desk = !desk;
//         }
//     })
// })
document.querySelectorAll('.slider-button').forEach((item) => {
    item.addEventListener('touchstart', function (e) {
        if (desk) {
            document.querySelectorAll('.description').forEach((item) => {
                e.target.innerHTML = "Hide"
                item.classList.add('desk-active')
            })
            desk = !desk;
        } else {
            document.querySelectorAll('.description').forEach((item) => {
                e.target.innerHTML = "Show"
                item.classList.remove('desk-active')
            })
            desk = !desk;
        }
    })
})

document.querySelector('.education-button-field').addEventListener('click', toggleEd)

function toggleEd() {
    if (down) {
        document.querySelector('.click').classList.add('rotate')
        document.querySelector('.ul').classList.add('swipe')
        document.querySelector('.projects').classList.add('swipe')
        down = !down;
    } else {
        document.querySelector('.click').classList.remove('rotate')
        document.querySelector('.ul').classList.remove('swipe')
        document.querySelector('.projects').classList.remove('swipe')
        down = !down;
    }
}


function hideButtons() {
    document.querySelector('.to-desktop').classList.remove('show')
    document.querySelector('.back').classList.remove('show')
    document.querySelector('.to-mobile').classList.remove('show')
    document.querySelector('.to-desktop').classList.add('hide')
    document.querySelector('.back').classList.add('hide')
    document.querySelector('.to-mobile').classList.add('hide')
}


function toProject(frame) {
    if (document.querySelector('.container').offsetWidth > 414) {
        frame.classList.add('desktop');
        document.querySelector('.to-mobile').classList.remove('hide')
        document.querySelector('.to-mobile').classList.add('show')
    } else {
        frame.classList.add('mobile');
    }
    frame.classList.remove('hide');
    document.querySelector('.container').classList.remove('show')
    frame.classList.add('show');
    document.querySelector('.container').classList.add('hide')
    document.querySelector('.back').classList.remove('hide');
    document.querySelector('.back').classList.add('show');
}

let frame;
document.getElementById('first').addEventListener('click', function () {
    frame = document.getElementById('theyalow');
    toProject(frame);
})
document.getElementById('second').addEventListener('click', function () {
    frame = document.getElementById('repair');
    toProject(frame);
})


document.querySelector('.back').addEventListener('click', function () {
    frame.classList.remove('show');
    document.querySelector('.container').classList.remove('hide')
    frame.classList.add('hide');
    document.querySelector('.container').classList.add('show');
    frame.classList.remove('desktop');
    frame.classList.remove('mobile');
    hideButtons();
    frame = null;
})

document.querySelector('.to-mobile').addEventListener('click', function () {
    document.querySelector('.to-mobile').classList.remove('show')
    document.querySelector('.to-mobile').classList.add('hide')
    document.querySelector('.to-desktop').classList.remove('hide')
    document.querySelector('.to-desktop').classList.add('show')
    frame.classList.remove('desktop');
    frame.classList.add('mobile');
})

document.querySelector('.to-desktop').addEventListener('click', function () {
    document.querySelector('.to-desktop').classList.remove('show')
    document.querySelector('.to-desktop').classList.add('hide')
    document.querySelector('.to-mobile').classList.remove('hide')
    document.querySelector('.to-mobile').classList.add('show')
    frame.classList.remove('mobile');
    frame.classList.add('desktop');
})

document.querySelector('.projects').addEventListener('click', (e) => e.target)
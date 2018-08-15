import BiuBullet from './Biu-bullet';
import BiuTrack from './Biu-track';

var attribute = new WeakMap();

function attr() {
    if (attribute.has(this)) {
        return attribute.get(this);
    } else {
        let obj = {};
        attribute.set(this, obj);
        return obj;
    }
}

class Biu {
    constructor(obj) {
        let thisAttr = attr.call(this);
        let el;
        if (obj.el instanceof HTMLElement) {
            el = obj.el;
        } else if (typeof obj.el === 'string') {
            el = document.querySelector(obj.el);
        }
        thisAttr.container = createDanmakuContainer();
        el.appendChild(thisAttr.container);
        this.config = {
            speed: obj.speed || 6000,  // * millisecond to complete
        };
        this.style = {  //default global style
            color: '#FFF',
            fontFamily: 'SimHei',
            fontSize: '25px',
            fontWeight: 'normal',
            opacity: 1,
        };
        thisAttr.bList = [];        //flying danmaku node
        thisAttr.prepareList = [];  //store danmaku when biu is paused 
        thisAttr.progress = {       //play progress
            value: 0,
            pause: 0,
            start: 0,
            currentSecond: 0,
        };
        thisAttr.timer = null;
        thisAttr.clip = new Map;  //danmaku data
        thisAttr.track = {        //flying danmaku track
            roll: new BiuTrack(),
            top: new BiuTrack(),
            bottom: new BiuTrack(),
        }
        thisAttr.state = 0;  //0=stop, 1=play, 2=pause
        if (obj.config) {
            //set custom config
            let keys = Object.keys(obj.config);
            for (let i = 0; i < keys.length; ++i) {
                this.config[keys[i]] = obj.config[keys[i]];
            }
        }
        if (obj.style) {
            //set custom style
            let keys = Object.keys(obj.style);
            for (let i = 0; i < keys.length; ++i) {
                this.style[keys[i]] = obj.style[keys[i]];
            }
        }
        return this;
    }

    getAttr() {
        return attr.call(this);
    }

    play(t) {
        let thisAttr = attr.call(this);
        let progress = thisAttr.progress;
        if (thisAttr.state === 1 && t === undefined) {
            //do not change timeline when playing without current time provided
            return;
        }
        let fromPause = thisAttr.state === 2;
        let fromStop = thisAttr.state === 0;
        let fromPlay = thisAttr.state === 1;
        thisAttr.state = 1;
        let now = Date.now();
        let biu = this;
        progress.start = now;
        if (t !== undefined) {
            //change timeline
            progress.value = t;
            progress.currentSecond = Math.floor(t / 1000);
            this.clear();
            renderThisSecond.call(this);
        }
        if (fromPlay) {
            return;
        } else if (fromPause) {
            if (t === undefined) {
                let t = now - progress.pause;
                thisAttr.track.roll.sync(t);
                thisAttr.track.top.sync(t);
                thisAttr.track.bottom.sync(t);
            }
            //resume every danmaku node
            thisAttr.bList.forEach(function(v){
                v.resume();
            });
        } else if (fromStop) {
            if (t === undefined) {
                renderThisSecond.call(this);
            }
        }
        //===
        let currentValue = progress.value;
        let currentSecond = Math.ceil(currentValue / 1000);
        let currentOffset = 1000 - currentValue % 1000;
        if (progress.currentSecond !== currentSecond) {
            progress.currentSecond = currentSecond;
            biu.biu(currentSecond, currentOffset);
        }
        //===
        let f = function(){
            let currentValue = Date.now() - progress.start + progress.value;
            let currentSecond = Math.ceil(currentValue / 1000);
            let currentOffset = 1000 - currentValue % 1000;
            if (progress.currentSecond === currentSecond) {
                return;
            }
            progress.currentSecond = currentSecond;
            biu.biu(currentSecond, currentOffset);
        };
        thisAttr.timer = setInterval(f, 500);

        //render and shot prepare danmaku
        if (thisAttr.prepareList.length > 0) {
            biu.render(thisAttr.prepareList, 0, true);
            thisAttr.prepareList.splice(0, thisAttr.prepareList.length);
        }
    }

    biu(second, delay) {
        let thisAttr = attr.call(this);
        let bList = thisAttr.bList;
        let container = thisAttr.container;
        let now = Date.now();
        let biu = this;
        //delete invisible danmaku node
        let i = 0;
        for (; i < bList.length; ++i) {
            if (/*bList[i].state == 1 && */now >= bList[i].speed + bList[i].startTime) {
                container.removeChild(bList[i].dom);
            } else {
                break;
            }
        }
        if (i > 0) bList.splice(0, i);
        if (isDocumentHidden()) {
            return;
        }
        let arr = thisAttr.clip.get(second);
        if (arr) biu.render(arr, delay);
    }

    load(arr) {
        if (!(arr instanceof Array)) {
            arr = [arr];
        }
        let biu = this;
        arr.forEach(function(v){
            let danmaku = createDanmakuNode.call(biu, v);
            if (danmaku === null) { 
                return;
            }
            loadDanmaku.call(biu, danmaku);
        });
        return this;
    }

    render(danmakus, delay, immediately) {
        if (!delay) {
            delay = 0;
        }
        if (immediately === undefined) {
            immediately = false;
        }
        let rollArr = [],
            topArr = [],
            bottomArr = [];
        for (let i = 0; i < danmakus.length; ++i) {
            let node = danmakus[i];
            let dom = createBiuDom.call(this, node);
            let obj = {
                dom: dom,
                node: node,
                delay: delay,
                immediately: immediately,
            };
            switch (node.type) {
                case 1:
                    topArr.push(obj);
                    break;
                case 2:
                    bottomArr.push(obj);
                    break;
                default:
                    rollArr.push(obj);
            }
        }
        if (rollArr.length > 0) {
            renderRollBullet.call(this, rollArr);
        }
        if (topArr.length > 0) {
            renderTopBullet.call(this, topArr);
        }
        if (bottomArr.length > 0) {
            renderBottomBullet.call(this, bottomArr);
        }
    }

    shot(obj, load) {
        let thisAttr = attr.call(this);
        if (thisAttr.state === 1) {
            obj.time = Date.now() - thisAttr.progress.start + thisAttr.progress.value;
        } else if (thisAttr.state === 2) {
            obj.time = thisAttr.progress.value;
        } else {
            return;
        }
        let danmaku = createDanmakuNode.call(this, obj);
        if (danmaku === null) {
            return;
        }
        if (thisAttr.state === 1) {
            this.render([danmaku], 0, true);
        } else {
            thisAttr.prepareList.push(danmaku);
        }
        if (load) {
            loadDanmaku.call(this, danmaku);
        }
    }

    pause() {
        let thisAttr = attr.call(this);
        if (thisAttr.state !== 1) {
            return;
        }
        thisAttr.state = 2;
        clearInterval(thisAttr.timer);
        let now = Date.now();
        thisAttr.progress.pause = now;
        thisAttr.progress.value += now - thisAttr.progress.start;
        thisAttr.bList.forEach(function(v){
            if (now < v.speed + v.startTime) {
                v.pause();
            }
        });
    }

    clear() {
        let thisAttr = attr.call(this);
        let container = thisAttr.container;
        let track = thisAttr.track;
        thisAttr.bList.forEach(function(v){
            container.removeChild(v.dom);
        });
        thisAttr.bList.splice(0, thisAttr.bList.length);
        track.roll.clear();
        track.top.clear();
        track.bottom.clear();
    }
}

function createDanmakuContainer() {
    let container = document.createElement('div');
    //initialize container style
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.style.height = '100%';
    container.style.width = '100%';
    container.style.pointerEvents = 'none';
    return container;
}

function isDocumentHidden() {
    if (document.hidden !== undefined) {
        return document.hidden;
    } else if (document.webkitHidden !== undefined) {
        return document.webkitHidden;
    } else {
        return false;
    }
}

function createBiuDom(obj) {
    let dom = document.createElement('div');
    dom.innerText = obj.text;
    let globalStyle = this.style;
    //set global style
    Object.keys(globalStyle).forEach(k => {
        dom.style[k] = globalStyle[k];
    });
    //set node style
    Object.keys(obj.style).forEach(k => {
        dom.style[k] = obj.style[k];
    });
    //set Biu style
    dom.style.position = 'absolute';
    dom.style.whiteSpace = 'pre';
    dom.style.display = 'inline-block';
    dom.style.userSelect = 'none';
    dom.style.webkitUserSelect = 'none';
    dom.style.pointerEvents = 'none';
    dom.style.textShadow = '0 0 1px #000, 0 0 1px #000, 0 0 1px #000';
    return dom;
}

function createDanmakuNode(obj) {
    if (obj.time === undefined || obj.text === undefined) {
        return null;
    }
    if (!obj.style) {
        obj.style = {};
        if (obj.color) {
            obj.style.color = obj.color;
        }
    } else if (!obj.style.color) {
        obj.style.color = obj.color;
    }
    let second = Math.floor(obj.time / 1000),
        offset = obj.time % 1000;
    let danmaku = {
        second: second,
        offset: offset,
        type: obj.type || 0,
        text: obj.text,
        style: obj.style,
    };
    return danmaku;
}

function loadDanmaku(d) {
    let clip = attr.call(this).clip;
    if (clip.has(d.second)) {
        let arr = clip.get(d.second);
        //TODO:用二分查找优化
        for (let i = 0; i < arr.length; ++i) {
            if (arr[i].offset > d.offset) {
                arr.splice(i, 0, d);
                return;
            }
        }
        arr.push(d);
    } else {
        clip.set(d.second, [d])
    }
}

function renderThisSecond() {
    let thisAttr = attr.call(this);
    let second = Math.floor(thisAttr.progress.value / 1000);
    let offset = thisAttr.progress.value % 1000;
    if (!thisAttr.clip.has(second)) {
        return;
    }
    let danmakus = thisAttr.clip.get(second);
    let t = [];
    let i = 0;
    for (; i < danmakus.length; ++i) {
        if (danmakus[i].offset >= offset) {
            break;
        }
    }
    if (i >= danmakus.length) {
        return;
    }
    t = danmakus.slice(i);
    this.render(t, -offset);
}

function renderRollBullet(arr) {
    let globalConfig = this.config;
    let thisAttr = attr.call(this);
    let container = thisAttr.container,
        cch = container.clientHeight,
        ccw = container.clientWidth;
    let now = Date.now();
    arr.forEach(arrNode => {
        let dom = arrNode.dom,
            danmakuObj = arrNode.node,
            delay = arrNode.delay,
            immediately = arrNode.immediately,
            totalOffset = immediately ? 0 : delay + danmakuObj.offset;
        dom.style.left = ccw + 2 + 'px'; //2 is shadow width
        dom.style.willChange = "transform";
        container.appendChild(dom);
        let bullet = new BiuBullet({
            cfgObj: danmakuObj,
            dom: dom,
            speed: globalConfig.speed,
            offset: totalOffset,
            distination: ccw + dom.offsetWidth + 2 + 2,  //2 is shadow width
            startTime: now + totalOffset,
        });
        thisAttr.bList.push(bullet);
        let pxSpeed = bullet.distination / bullet.speed;
        let finish = now + bullet.speed + totalOffset;
        let touchLeft = (bullet.distination - dom.offsetWidth - 2) / pxSpeed + now + totalOffset;  //2 is shadow width
        let appear = dom.offsetWidth / pxSpeed + now + totalOffset;
        let track = thisAttr.track.roll;
        let top = track.roll(now + totalOffset, cch, appear, touchLeft, finish, dom.offsetHeight);
        dom.style.top = top + 'px';
        bullet.shot();
    });
}

function renderTopBullet(arr) {
    let globalConfig = this.config;
    let thisAttr = attr.call(this);
    let container = thisAttr.container,
        cch = container.clientHeight,
        ccw = container.clientWidth;
    let now = Date.now();
    arr.forEach(arrNode => {
        let dom = arrNode.dom,
            danmakuObj = arrNode.node,
            delay = arrNode.delay,
            immediately = arrNode.immediately,
            totalOffset = immediately ? 0 : delay + danmakuObj.offset;
        dom.style.left = ccw + 2 + 'px'; //2 is shadow width
        dom.style.willChange = "transform";
        container.appendChild(dom);
        let bullet = new BiuBullet({
            cfgObj: danmakuObj,
            dom: dom,
            speed: globalConfig.speed,
            offset: totalOffset,
            distination: (ccw + dom.offsetWidth) / 2 + 2,  //2 is shadow width
            startTime: now + totalOffset,
        });
        let finish = now + bullet.speed + bullet.offset;
        let track = thisAttr.track.top;
        let top = track.top(now + totalOffset, cch, finish, dom.offsetHeight);
        dom.style.top = top + 'px';
        bullet.top = top;
        thisAttr.bList.push(bullet);
        bullet.shot();
    });
}

function renderBottomBullet(arr) {
    let globalConfig = this.config;
    let thisAttr = attr.call(this);
    let container = thisAttr.container,
        cch = container.clientHeight,
        ccw = container.clientWidth;
    let now = Date.now();
    arr.forEach(arrNode => {
        let dom = arrNode.dom,
            danmakuObj = arrNode.node,
            delay = arrNode.delay,
            immediately = arrNode.immediately,
            totalOffset = immediately ? 0 : delay + danmakuObj.offset;
        dom.style.left = ccw + 2 + 'px'; //2 is shadow width
        dom.style.willChange = "transform";
        container.appendChild(dom);
        let bullet = new BiuBullet({
            cfgObj: danmakuObj,
            dom: dom,
            speed: globalConfig.speed,
            offset: totalOffset,
            distination: (ccw + dom.offsetWidth) / 2 + 2,  //2 is shadow width
            startTime: now + totalOffset,
        });
        let finish = now + bullet.speed + bullet.offset;
        let track = thisAttr.track.bottom;
        let top = track.bottom(now + totalOffset, cch, finish, dom.offsetHeight);
        dom.style.top = top + 'px';
        bullet.top = top;
        thisAttr.bList.push(bullet);
        bullet.shot();
    });
}

export default Biu;

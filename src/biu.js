import BiuBullet from './biu-bullet';

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
        //initialize container style
        let thisAttr = attr.call(this);
        let el = document.querySelector(obj.el);
        let container = document.createElement('div');
        container.style.position = 'relative';
        container.style.overflow = 'hidden';
        container.style.height = '100%';
        container.style.width = '100%';
        container.style.pointerEvents = 'none';
        el.appendChild(container);

        thisAttr.container = container;
        this.config = {
            speed: 6000,    // * millisecond to complete
        };
        this.style = {
            fontSize: '25px',
            opacity: 1,
            fontFamily: 'SimHei',
        };
        thisAttr.bList = [];    //flying danmaku node
        thisAttr.prepareList = []; //store danmaku when biu is paused 
        thisAttr.progress = {
            value: 0,
            pause: 0,
            start: 0,
            currentSecond: 0
        };  //play progress

        thisAttr.timer = null;
        thisAttr.clip = new Map;              //danmaku data
        thisAttr.track = {    //flying danmaku track
            roll: new Map,
            top: new Map,
            bottom: new Map,
            rollTop: 0,
            topTop: 0
        }
        thisAttr.state = 0;    //0=stop, 1=play, 2=pause

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
                biu.syncTrack(now - progress.pause);
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
            thisAttr.prepareList.forEach(function(v){
                biu.render(v);
            });
            thisAttr.prepareList = [];
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

    load(obj) {
        let danmaku = createDanmakuNode(obj);
        if (danmaku === null) { 
            return;
        }
        loadDanmaku.call(this, danmaku);
    }

    render(danmakus, delay) {
        for (let i = 0; i < danmakus.length; ++i) {
            let node = danmakus[i];
            let dom = createBiuDom.call(this);
            dom.innerText = node.text;
            if (node.color) dom.style.color = node.color; //=node.style.color
            if (typeof node.style === 'object') {
                Object.keys(node.style).forEach(function(v){
                    dom.style[v] = node.style[v];
                });
            }
            switch (node.type) {
                case 2:
                    renderTopBullet.call(this, dom, node, delay);
                    break;
                case 1:
                    break;
                default:
                    renderRollBullet.call(this, dom, node, delay);
            }      
        }
    }

    shot(obj, load) {
        let thisAttr = attr.call(this);
        obj.time = this.progress.value;
        let danmaku = createDanmakuNode(obj);
        if (danmaku === null) {
            return;
        }
        if (thisAttr.state === 1) {
            this.render([danmaku]);
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
        let now = Date.now();
        thisAttr.progress.pause = now;
        thisAttr.progress.value += now - thisAttr.progress.start;
        clearInterval(thisAttr.timer);
        thisAttr.bList.forEach(function(v){
            v.pause();
        });
    }

    syncTrack(t) {
        let track = attr.call(this).track;
        track.roll.forEach(function(v){
            v.appear += t;
            v.finish += t;
        });
        track.top.forEach(function(v){
            v.finish += t;
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
        track.topTop = 0;
        track.rollTop = 0;
    }
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

function createBiuDom() {
    let dom = document.createElement('div');
    let style = this.style;
    dom.style.position = 'absolute';
    dom.style.whiteSpace = 'pre';
    dom.style.display = 'inline-block';
    dom.style.userSelect = 'none';
    dom.style.webkitUserSelect = 'none';
    dom.style.pointerEvents = 'none';
    dom.style.color = '#fff';
    dom.style.fontSize = style.fontSize;
    dom.style.fontFamily = style.fontFamily;
    dom.style.fontWeight = 'bold';
    dom.style.opacity = style.opacity;
    dom.style.textShadow = '0 0 1px #000, 0 0 1px #000, 0 0 1px #000';
    return dom;
}

function createDanmakuNode(obj) {
    if (obj.time === undefined || obj.text === undefined) return null;
    let danmaku = {
        second: 0,
        offset: 0,
        type: 0,
        text: obj.text,
        color: '#fff'
    };
    let s = Math.floor(obj.time / 1000);
    danmaku.second = s;
    danmaku.offset = obj.time % 1000;
    if (obj.color) {
        danmaku.color = obj.color;
    }
    if (obj.type) {
        danmaku.type = obj.type;
    }
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
    t = danmakus.slice(i)
    this.render(t, -offset);
}

function renderRollBullet(dom, node, delay) {
    let thisAttr = attr.call(this);
    let container = thisAttr.container;
    let config = this.config;
    let totalOffset = delay + node.offset;
    let now = Date.now();
    dom.style.left = container.clientWidth + 1 + 'px'; //1 is shadow width
    dom.style.willChange = "transform";
    container.appendChild(dom);
    let bullet = new BiuBullet({
        cfgObj: node,
        dom: dom,
        speed: config.speed,
        offset: totalOffset
    });
    bullet.distination = container.clientWidth + dom.offsetWidth + 2 * 1;//1 is shadow width
    let pxSpeed = bullet.distination / bullet.speed;
    let finish = now + bullet.speed + totalOffset;
    let touchLeft = (bullet.distination - dom.offsetWidth - 1) / pxSpeed + now + totalOffset;//1 is shadow width
    let appear = dom.offsetWidth / pxSpeed + now + totalOffset;
    let perfect = false;
    let top = 0;
    let track = thisAttr.track;
    while (top <= container.clientHeight - dom.offsetHeight) {
        if (!track.roll.has(top) || (now + totalOffset >= track.roll.get(top).appear && track.roll.get(top).finish <= touchLeft)) {
            perfect = true;
            break;
        }
        top += dom.offsetHeight;
    }
    if (!perfect) {
        if (track.rollTop >= container.clientHeight - dom.offsetHeight) {
            track.rollTop = 0;
        }
        top = track.rollTop;
        track.rollTop += dom.offsetHeight;
    }

    dom.style.top = top + 'px';
    bullet.startTime = now + totalOffset;
    track.roll.set(top, {
        appear: appear,
        finish: finish
    });
    thisAttr.bList.push(bullet);
    bullet.shot();
}

function renderTopBullet(dom, node, delay) {
    let thisAttr = attr.call(this);
    let config = this.config;
    let container = thisAttr.container;
    let totalOffset = delay + node.offset;
    let now = Date.now();
    dom.style.left = container.clientWidth + 1 + 'px'; //1 is shadow width
    //dom.style.willChange = "opacity";
    container.appendChild(dom);
    let bullet = new BiuBullet({
        cfgObj: node,
        dom: dom,
        speed: config.speed,
        offset: totalOffset
    });
    bullet.distination = (container.clientWidth + dom.offsetWidth) / 2 + 1;//1 is shadow width
    let finish = now + bullet.speed + bullet.offset;
    let perfect = false;
    let top = 0;
    let track = thisAttr.track;
    while (top <= container.clientHeight - dom.offsetHeight) {
        if (!track.top.has(top) || now + bullet.offset >= track.top.get(top).finish) {
            perfect = true;
            break;
        }
        top += dom.offsetHeight;
    }
    if (!perfect) {
        if (track.topTop >= container.clientHeight - dom.offsetHeight) {
            track.topTop = 0;
        }
        top = track.topTop;
        track.topTop += dom.offsetHeight;
    }
    dom.style.top = top + 'px';
    bullet.startTime = now + bullet.offset;
    track.top.set(top, {
        finish: finish
    });
    thisAttr.bList.push(bullet);
    bullet.shot();
}

export default Biu;

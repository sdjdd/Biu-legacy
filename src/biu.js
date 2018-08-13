import BiuBullet from './biu-bullet';

class Biu {
    constructor(obj) {
        //initialize container style
        this.el = document.querySelector(obj.el);
        this.container = document.createElement('div');
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';
        this.container.style.height = '100%';
        this.container.style.width = '100%';
        this.container.style.pointerEvents = 'none';
        this.el.appendChild(this.container);
        this.config = {
            fontSize: '25px',
            opacity: 1,
            speed: 6000,    // * millisecond to complete
            fontFamily: 'SimHei',
        }
        this.bList = [];    //flying danmaku node
        this.prepareList = []; //store danmaku when biu is paused 
        
        
        this.progress = {
            value: 0,
            pause: 0,
            start: 0,
            currentSecond: 0
        };  //play progress

        this.timer = null;
        this.clip = new Map;              //danmaku data
        this.track = {    //flying danmaku track
            roll: new Map,
            top: new Map,
            bottom: new Map,
            rollTop: 0,
            topTop: 0
        }
        this.state = 0;    //0=stop, 1=play, 2=pause

    }

    play(t) {
        if (this.state === 1 && t === undefined) {
            //do not change timeline when playing without current time provided
            return;
        }
        let fromPause = this.state === 2;
        let fromStop = this.state === 0;
        let fromPlay = this.state === 1;
        this.state = 1;
        let now = Date.now();
        let biu = this;
        this.progress.start = now;
        if (t !== undefined) {
            //change timeline
            this.progress.value = t;
            this.progress.currentSecond = Math.floor(t / 1000);
            this.clear();
            renderThisSecond.call(this);
        }
        if (fromPlay) {
            return;
        } else if (fromPause) {
            if (t === undefined) {
                biu.syncTrack(now - biu.progress.pause);
            }
            //resume every danmaku node
            this.bList.forEach(function(v){
                v.resume();
            });
        } else if (fromStop) {
            if (t === undefined) {
                renderThisSecond.call(this);
            }
        }
        //===
        
        let progress = biu.progress;
        let currentValue = progress.value;
        let currentSecond = Math.ceil(currentValue / 1000);
        let currentOffset = 1000 - currentValue % 1000;
        if (biu.progress.currentSecond !== currentSecond) {
            biu.progress.currentSecond = currentSecond;
            biu.biu(currentSecond, currentOffset);
        }
        
        //===
        let f = function(){
            let progress = biu.progress;
            let currentValue = Date.now() - progress.start + progress.value;
            let currentSecond = Math.ceil(currentValue / 1000);
            let currentOffset = 1000 - currentValue % 1000;
            if (biu.progress.currentSecond === currentSecond) {
                return;
            }
            biu.progress.currentSecond = currentSecond;
            biu.biu(currentSecond, currentOffset);
        };
        f();
        this.timer = setInterval(f, 500);

        //render and shot prepare danmaku
        if (biu.prepareList.length > 0) {
            biu.prepareList.forEach(function(v){
                biu.render(v);
            });
            biu.prepareList = [];
        }
    }

    biu(second, delay) {
        let biu = this;
        let now = Date.now();
        //delete invisible danmaku node
        let i = 0;
        for (; i < this.bList.length; ++i) {
            if (this.bList[i].state == 1 && now >= this.bList[i].speed + this.bList[i].startTime) {
                biu.container.removeChild(this.bList[i].dom);
            } else {
                break;
            }
        }
        if (i > 0) this.bList.splice(0, i);
        if (isDocumentHidden()) {
            return;   
        }
        let arr = this.clip.get(second);
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
        obj.time = this.progress.value;
        let danmaku = createDanmakuNode(obj);
        if (danmaku === null) {
            return;
        }
        if (this.state === 1) {
            this.render([danmaku]);
        } else {
            this.prepareList.push(danmaku);
        }
        if (load) {
            loadDanmaku.call(this, danmaku);
        }
    }

    pause() {
        if (this.state !== 1) {
            return;
        }
        this.state = 2;
        let now = Date.now();
        this.progress.pause = now;
        this.progress.value += now - this.progress.start;
        clearInterval(this.timer);
        this.bList.forEach(function(v){
            v.pause();
        });
    }

    syncTrack(t) {
        this.track.roll.forEach(function(v){
            v.appear += t;
            v.finish += t;
        });
        this.track.top.forEach(function(v){
            v.finish += t;
        });
    }

    clear() {
        let container = this.container;
        let track = this.track;
        this.bList.forEach(function(v){
            container.removeChild(v.dom);
        });
        this.bList.splice(0, this.bList.length);
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
    dom.style.position = 'absolute';
    dom.style.whiteSpace = 'pre';
    dom.style.display = 'inline-block';
    dom.style.userSelect = 'none';
    dom.style.webkitUserSelect = 'none';
    dom.style.pointerEvents = 'none';
    dom.style.color = '#fff';
    dom.style.fontSize = this.config.fontSize;
    dom.style.fontFamily = this.config.fontFamily;
    dom.style.fontWeight = 'bold';
    dom.style.opacity = this.config.opacity;
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
    if (this.clip.has(d.second)) {
        let arr = this.clip.get(d.second);
        //TODO:用二分查找优化
        for (let i = 0; i < arr.length; ++i) {
            if (arr[i].offset > d.offset) {
                arr.splice(i, 0, d);
                return;
            }
        }
        arr.push(d);
    } else {
        this.clip.set(d.second, [d])
    }
}

function renderThisSecond() {
    let second = Math.floor(this.progress.value / 1000);
    let offset = this.progress.value % 1000;
    if (!this.clip.has(second)) {
        return;
    }
    let danmakus = this.clip.get(second);
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
    let totalOffset = delay + node.offset;
    let now = Date.now();
    dom.style.left = this.container.clientWidth + 1 + 'px'; //1 is shadow width
    dom.style.willChange = "transform";
    this.container.appendChild(dom);
    let bullet = new BiuBullet({
        cfgObj: node,
        dom: dom,
        speed: this.config.speed,
        offset: totalOffset
    });
    bullet.distination = this.container.clientWidth + dom.offsetWidth + 2 * 1;//1 is shadow width
    let pxSpeed = bullet.distination / bullet.speed;
    let finish = now + bullet.speed + totalOffset;
    let touchLeft = (bullet.distination - dom.offsetWidth - 1) / pxSpeed + now + totalOffset;//1 is shadow width
    let appear = dom.offsetWidth / pxSpeed + now + totalOffset;
    let perfect = false;
    let top = 0;
    let track = this.track.roll;
    while (top <= this.container.clientHeight - dom.offsetHeight) {
        if (!track.has(top) || (now + totalOffset >= track.get(top).appear && track.get(top).finish <= touchLeft)) {
            perfect = true;
            break;
        }
        top += dom.offsetHeight;
    }
    if (!perfect) {
        if (this.track.rollTop >= this.container.clientHeight - dom.offsetHeight) {
            this.track.rollTop = 0;
        }
        top = this.track.rollTop;
        this.track.rollTop += dom.offsetHeight;
    }

    dom.style.top = top + 'px';
    bullet.startTime = now + totalOffset;
    track.set(top, {
        appear: appear,
        finish: finish
    });
    this.bList.push(bullet);
    bullet.shot();
}

function renderTopBullet(dom, node, delay) {
    let totalOffset = delay + node.offset;
    let now = Date.now();
    dom.style.left = this.container.clientWidth + 1 + 'px'; //1 is shadow width
    //dom.style.willChange = "opacity";
    this.container.appendChild(dom);
    let bullet = new BiuBullet({
        cfgObj: node,
        dom: dom,
        speed: this.config.speed,
        offset: totalOffset
    });
    bullet.distination = (this.container.clientWidth + dom.offsetWidth) / 2 + 1;//1 is shadow width
    let finish = now + bullet.speed + bullet.offset;
    let perfect = false;
    let top = 0;
    let track = this.track.top;
    while (top <= this.container.clientHeight - dom.offsetHeight) {
        if (!track.has(top) || now + bullet.offset >= track.get(top).finish) {
            perfect = true;
            break;
        }
        top += dom.offsetHeight;
    }
    if (!perfect) {
        if (this.track.topTop >= this.container.clientHeight - dom.offsetHeight) {
            this.track.topTop = 0;
        }
        top = this.track.topTop;
        this.track.topTop += dom.offsetHeight;
    }
    dom.style.top = top + 'px';
    bullet.startTime = now + bullet.offset;
    track.set(top, {
        finish: finish
    });
    this.bList.push(bullet);
    bullet.shot();
}

export default Biu;

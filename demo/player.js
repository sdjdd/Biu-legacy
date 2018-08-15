var video = document.querySelector('.player video');
var biu = new Biu({
    el: '.danmaku',
    speed: 7000,
    style: {
        opacity: 1,
        fontSize: '25px',
        fontWeight: 'bold',
    }
}).load(danmakuData);

var seeked = false;
var currentTime = 0;
var divDanmaku = document.querySelector('.danmaku');
var cbProtectEyes = document.querySelector('#cb-pe');
cbProtectEyes.onchange = function(){
    if (this.checked) {
        divDanmaku.classList.add('cover');
    } else {
        divDanmaku.classList.remove('cover');
    }
}

video.onseeked = function(){
    seeked = true;
    currentTime = video.currentTime;
}

video.onplay = function(){
    if (seeked) {
        seeked = false;
        let ms = Math.round(currentTime * 1000);
        biu.play(ms);
    } else {
        biu.play();
    }
}

video.onpause = function(){
    biu.pause();
}

video.onended = () => {
    currentTime = 0;
    seeked = true;
}
# Biu
A simple css danmaku plugin.  
[Demo](https://sdjdd.github.io/Biu/demo/index.html)

## 开始使用
```js
var biu = new Biu({
    el: '.danmaku-area'
});

biu.load({
    time: 0,
    text: 'Hello world!'
});

biu.play();
```

## 初始化
### el
- **类型：** `string`
- **说明：** 作为弹幕容器的DOM元素。

### config
- **类型：** `Object`
- **说明：** Biu的配置数据，包含：  
`speed` 弹幕速度（毫秒），表示弹幕从出现到消失所用的时间，默认6000。

### style
- **类型：** `Object`
- **说明：** 弹幕元素的样式，包含：  
`fontSize` 弹幕字号，默认25px。  
`fontFamily` 弹幕字体，默认SimHei。  
`opacity` 弹幕透明度，默认1。  
用户可提供其他有效的参数修改弹幕元素的样式，但并非所有样式都会被应用，由Biu统一管理的样式将会再次覆盖用户的设置。

## API
### load(danmaku)
- **参数：** `{Object | Array} danmaku`
- **说明：** 将弹幕对象或包含弹幕对象的数组danmaku装载到弹幕列表中。弹幕对象包含：`color`CSS颜色（默认#fff），`text`文字，`time`出现时间（毫秒）和`type`类型（0滚动，1顶部，2底部，默认滚动）。一个有效的弹幕对象至少要包含文字和时间。

### play([time])
- **参数：** `{Number} [time]`
- **说明：** 将Biu切换至播放状态。如提供time参数还会改变Biu的时间轴至time毫秒处。Biu不监控时间轴的状态，即便提供相同的time参数也会触发时间轴修改，清空当前弹幕并从time处重新开始渲染。

### pause()
- **说明：** 将Biu切换至暂停状态。



























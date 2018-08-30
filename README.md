# Biu
A simple css danmaku plugin.  
[Demo](https://sdjdd.github.io/Biu/demo/index.html)

## Why Biu?
- ### 轻量级
  Biu是一个专注于渲染弹幕的插件，用户可以方便的将其整合到现有的项目中。
- ### 高度定制
  通过改变弹幕的样式统一项目风格。可为每一条弹幕设定独立的样式。


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
- **类型：** `string | HtmlElement`
- **说明：** 作为弹幕容器的DOM元素，可以是一个选择器字符串或HtmlElement实例。

### config
- **类型：** `Object`
- **说明：** Biu配置，包含：  
`{number} speed` 弹幕速度（毫秒），弹幕从出现到消失所用的时间，默认6000。

### style
- **类型：** `Object`
- **说明：** 全局弹幕样式，包含：  
`{string} color` 默认颜色，默认#FFF。  
`{string} fontFamily` 字体，默认SimHei。  
`{string} fontSize` 字号，默认25px。  
`{string} fontWeight` 字体粗细，默认normal。  
`{number} opacity` 透明度，默认1。  
用户可提供其他有效的参数修改弹幕的样式，但并非所有样式都会被应用，由Biu统一管理的样式将会再次覆盖用户的设置。

### speed
- **类型：** `number`
- **说明：** config.speed的简写。

## API
### load(danmaku)
- **参数：**  
`{Object | Array} danmaku` 弹幕对象
- **说明：**
将一组弹幕装载到弹幕列表中。弹幕对象包含：  
`{string} color` 颜色，默认#FFF。  
`{string} text` 弹幕内容。  
`{number} time` 出现时间（毫秒）。  
`{number} type` 类型（0滚动，1顶部，2底部），默认0。  
`{Object} style` 弹幕样式。  
一个有效的弹幕对象至少要包含`time`和`text`。

### play([time])
- **参数：**  
`{number} [time]` 时间戳
- **说明：**  
切换至播放状态。如提供time参数还会将时间轴改变至time毫秒处。  
Biu不监控时间轴的状态，即便提供相同的time参数也会触发时间轴修改，清空弹幕并从time处重新开始渲染。

### pause()
- **说明：**  
切换至暂停状态。

### clear()
- **说明：**  
清空弹幕。

### shot(danmaku, [load])
- **参数：**  
`{Object | Array} danmaku` 弹幕对象，等同于load函数的弹幕对象。  
`{boolean} [load]` 装载到弹幕列表中
- **说明：**  
Biu的预渲染机制无法自动渲染添加到当前时间轴位置的弹幕。通过`shot`函数实时渲染一组弹幕，可用于渲染当前观众发送的弹幕或无时间轴的直播模式。  

例：
```js
biu.shot({
    text: '666666',
    style: {
        border: '1px #0ff solid'  //增加边框
    }
});
```

























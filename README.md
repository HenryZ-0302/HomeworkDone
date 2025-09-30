# 打滑作业平台

[ENGLISH README](/README-EN.md)

> 学生们的兴趣 & 日常生活 很重要

开源 AI 家庭作业解答器, 为自学者节省时间的学习平台

## 为什么用 打滑作业

- 节省时间
- 无需遥测
- 开源，无黑盒
- 无垃圾电话
- 无需电话号码
- 可通过电脑、平板电脑或手机访问
- 人体工程学设计

## 现在尝试

官方实例部署在 [https://cubewhy.github.io/skid-homework](https://cubewhy.github.io/skid-homework)

您需要申请一个 Gemini API 密钥才能访问 AI。

[Google AI Studio](https://aistudio.google.com/api-keys)

### 为什么如此之慢

站点默认使用 Gemini 2.5 pro, 这个模型会一直思考, 如果你介意时间可以换为 `gemini-2.5-flash`

同时, 如果不需要详细的解析可以尝试如下prompt

```text
用中文输出答案
只需要输出答案即可，选择题不需要输出解析(留白即可)
```

### 为什么总是失败

- 检查你的IP 是否被Google 拉黑
- 检查API Key 是否有效
- 尝试使用 `gemini-2.5-flash` 模型

## Star 历史记录

如果这个项目节省了你的时间, 请务必献上一个 Star!

[![Star History Chart](https://api.star-history.com/svg?repos=cubewhy/skid-homework&type=Date)](https://www.star-history.com/#cubewhy/skid-homework&Date)

## 我的电脑上没有摄像头, 请帮帮我

[SkidCamera](https://github.com/cubewhy/SkidCamera) 正是您想要的。

为自学者设计的符合人体工程学的相机软件

请参照 SkidCamera README 中的步骤来使用

## 为什么太多作业不好

- 浪费时间
- 效率低下
- 影响睡眠质量
- 影响心理健康

## 觉得这违反了道德规范?

如果您这么认为，请不要使用它。

家庭作业旨在帮助学生理解知识，
而不是用来控制学生。

我个人使用可汗学院和维基百科来学习，
既省时又高效。

但学校可能会要求我提交作业...
这个平台只是解决这个问题的一个变通方法。

## License

This work is licensed under GPL-3.0

You're allowed to use, share and modify.

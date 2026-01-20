# 火锅大冒险 (Hotpot Rush)

这是一个基于 React 和 HTML5 Canvas 的物理挖土解谜游戏。

## 核心机制
- **挖土**: 使用 `globalCompositeOperation = 'destination-out'` 在 Canvas 上擦除像素。
- **物理**: 简单的自定义物理引擎，处理重力、碰撞和弹跳。
- **状态**: 食材有不同状态（如冻肉需要解冻）。
- **搭桥 (New)**: 玩家可以使用「魔法画笔」道具在场景中绘制实体木板，通过消耗墨水来改变地形，引导食材运动。

## 文件结构
- `index.html`: 入口与样式定义
- `app.js`: 应用路由与状态管理
- `components/GameLevel.js`: 游戏主循环、渲染逻辑与道具交互
- `utils/gamePhysics.js`: 物理逻辑类

## 更新记录
- Initial commit: 基础玩法框架，包含挖土、食材下落、障碍物交互。
- Feature: 增加魔法画笔道具，允许玩家绘制地形搭桥。
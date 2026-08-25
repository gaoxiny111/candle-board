# candle-board

基于《日本蜡烛图技术》的交易决策辅助看板（Phase 1 MVP）。

系统负责形态初筛与六层验证，人负责决策与执行。本工具**不是投资建议**，不提供自动下单。

## 功能

- 多品种 K 线（Binance / Yahoo，失败时回退演示数据）
- 1H / 4H / D / W，成交量、MA20/50/200、RSI / Stochastic / MACD、ATR
- 主图切换时显示大周期趋势箭头
- 单K / 双K / 三K / 持续形态 + Spring / Upthrust 初筛，S/A/B 分级
- 人手画支撑阻力（磁吸高低点），机器检测破位
- 六层过滤器交通灯 + 交易计划（止损/三级止盈/仓位/盈亏比）
- 检查清单不可跳过，可打印为 PDF

## 本地运行

需要 Node 20+ 与 Yarn 1。

```bash
yarn install
yarn dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 声明

辅助工具，非投资建议。形态识别只做初筛，所有信号必须经过六层过滤与人工终审。

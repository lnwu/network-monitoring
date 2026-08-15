# network-monitoring

OpenWrt 网络连通性监控（LuCI 应用）：实时检测国内 / 国际网络状态，记录每天的网络波动历史。

适用场景：光猫拨号 → 软路由（OpenWrt 25.12 + OpenClash）。

## 安装

前置依赖：OpenWrt 25.12 及以上（使用 apk 包管理器）、curl、sqlite3-cli、jsonfilter、sha256sum。缺失的可安装依赖会由脚本自动处理。

在路由器上执行一行命令：

```sh
curl -fsSL https://raw.githubusercontent.com/lnwu/network-monitoring/main/install.sh | sh
```

安装完成后访问 LuCI → 网络 → 网络监控。

## 验证

```sh
logread -e netmonitor          # 查看状态变化日志
ubus call netmonitor status    # 查看最近一次检测结果
```

## 升级

与安装相同，再执行一遍安装命令即可。脚本会在新包校验成功后停止服务、删除旧包及其登记文件，再安装新包；配置和监控历史会保留。

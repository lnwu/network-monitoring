# AGENTS.md

本文件包含 AI 在本项目中工作时必须遵守的规则和项目信息。

## 通用规则

- 回复我时使用中文。
- 写文档时使用中文。
- 生成代码时不用生成注释。
- 每次更新代码后检查 AGENTS.md 是否需要更新。

## 项目信息

- `.github/workflows/build.yml`：每次 push 到 main 分支时用 openwrt/sdk Docker 镜像（aarch64_cortex-a72，25.12.0）编译两个包并发布到名为 `latest` 的 Release（滚动更新），产物固定命名为 `netmonitor.ipk`、`luci-app-netmonitor.ipk`；两个包均为 `PKGARCH:=all`，架构无关；包版本号由 `NM_BUILD_VERSION` 环境变量注入（`1.0.<run_number>`，每次构建递增），Makefile 中默认回落到 `1.0.0`。
- `install.sh`：一行安装脚本（README 中的安装方式），先检测 OpenWrt 版本（要求 24.10+，SNAPSHOT 跳过检查），再检测依赖命令（curl/sqlite3/jsonfilter）并用 apk 自动安装缺失的包（sqlite3 对应 sqlite3-cli 包），最后从 Release 下载并安装 ipk；仓库地址为 `lnwu/network-monitoring`。
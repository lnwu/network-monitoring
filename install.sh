#!/bin/sh
set -e

REPO=lnwu/network-monitoring

if ! command -v apk >/dev/null 2>&1; then
	echo "错误: 未找到 apk, 请确认 OpenWrt 24.10+ / 25.12"
	exit 1
fi

MISSING=""
for cmd in curl sqlite3 jsonfilter; do
	command -v "$cmd" >/dev/null 2>&1 || MISSING="$MISSING $cmd"
done

if [ -n "$MISSING" ]; then
	echo "错误: 缺少依赖:$MISSING"
	echo "请先执行: apk add$MISSING"
	exit 1
fi

BASE_URL="https://github.com/$REPO/releases/latest/download"

for p in netmonitor luci-app-netmonitor; do
	echo "下载 $p ..."
	curl -Lf "$BASE_URL/$p.ipk" -o "/tmp/$p.ipk"
done

apk add --allow-untrusted /tmp/netmonitor.ipk /tmp/luci-app-netmonitor.ipk

/etc/init.d/rpcd restart
/etc/init.d/netmonitor enable
/etc/init.d/netmonitor start

rm -rf /tmp/luci-* /tmp/netmonitor.ipk /tmp/luci-app-netmonitor.ipk

echo "安装完成, 请访问 LuCI -> 网络 -> Network Monitor"

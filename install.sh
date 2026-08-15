#!/bin/sh
set -e

REPO=lnwu/network-monitoring
MIN_VERSION=24.10

if [ ! -f /etc/openwrt_release ]; then
	echo "错误: 未找到 /etc/openwrt_release, 请确认当前系统为 OpenWrt"
	exit 1
fi

. /etc/openwrt_release

echo "检测到系统: $DISTRIB_DESCRIPTION"

case "$DISTRIB_RELEASE" in
	SNAPSHOT)
		echo "警告: 当前为 SNAPSHOT 版本, 未做版本检查"
		;;
	*)
		MAJOR=${DISTRIB_RELEASE%%.*}
		REST=${DISTRIB_RELEASE#*.}
		MINOR=${REST%%.*}
		MINOR=${MINOR%%[!0-9]*}
		if ! [ "$MAJOR" -eq "$MAJOR" ] 2>/dev/null || ! [ "$MINOR" -eq "$MINOR" ] 2>/dev/null; then
			echo "错误: 无法解析 OpenWrt 版本号: $DISTRIB_RELEASE"
			exit 1
		fi
		if [ "$MAJOR" -lt 24 ] || { [ "$MAJOR" -eq 24 ] && [ "$MINOR" -lt 10 ]; }; then
			echo "错误: 需要 OpenWrt $MIN_VERSION 及以上版本 (当前: $DISTRIB_RELEASE)"
			exit 1
		fi
		;;
esac

if ! command -v apk >/dev/null 2>&1; then
	echo "错误: 未找到 apk, 请确认 OpenWrt $MIN_VERSION+"
	exit 1
fi

MISSING_PKGS=""
for item in "curl:curl" "sqlite3:sqlite3-cli" "jsonfilter:jsonfilter"; do
	cmd=${item%%:*}
	pkg=${item#*:}
	if ! command -v "$cmd" >/dev/null 2>&1; then
		MISSING_PKGS="$MISSING_PKGS $pkg"
	fi
done

if [ -n "$MISSING_PKGS" ]; then
	echo "安装缺失依赖:$MISSING_PKGS ..."
	apk update
	apk add $MISSING_PKGS
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

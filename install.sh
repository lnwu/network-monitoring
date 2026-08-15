#!/bin/sh
set -e

REPO=lnwu/network-monitoring
MIN_VERSION=25.12

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
		if [ "$MAJOR" -lt 25 ] || { [ "$MAJOR" -eq 25 ] && [ "$MINOR" -lt 12 ]; }; then
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
for item in "curl:curl" "sqlite3:sqlite3-cli" "jsonfilter:jsonfilter" "sha256sum:busybox"; do
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
TMPDIR=$(mktemp -d /tmp/netmonitor-install.XXXXXX)
trap 'rm -rf "$TMPDIR"' EXIT

curl -Lf --retry 3 --retry-delay 2 --connect-timeout 15 --max-time 120 \
	"$BASE_URL/SHA256SUMS" -o "$TMPDIR/SHA256SUMS"

for p in netmonitor luci-app-netmonitor; do
	echo "下载 $p ..."
	curl -Lf --retry 3 --retry-delay 2 --connect-timeout 15 --max-time 120 \
		"$BASE_URL/$p.ipk" -o "$TMPDIR/$p.ipk"
	expected=$(awk -v name="$p.ipk" '$2 == name { print $1 }' "$TMPDIR/SHA256SUMS")
	actual=$(sha256sum "$TMPDIR/$p.ipk" | awk '{ print $1 }')
	if [ -z "$expected" ] || [ "$expected" != "$actual" ]; then
		echo "错误: $p 校验失败"
		exit 1
	fi
done

apk add --allow-untrusted "$TMPDIR/netmonitor.ipk" "$TMPDIR/luci-app-netmonitor.ipk"

/etc/init.d/rpcd restart
/etc/init.d/netmonitor enable
/etc/init.d/netmonitor start

echo "安装完成, 请访问 LuCI -> 网络 -> Network Monitor"

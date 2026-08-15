include $(TOPDIR)/rules.mk

PKG_NAME:=netmonitor
PKG_VERSION:=$(if $(NM_BUILD_VERSION),$(NM_BUILD_VERSION),1.0.0)
PKG_RELEASE:=1
PKG_LICENSE:=MIT
PKG_MAINTAINER:=lnwu

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)

include $(INCLUDE_DIR)/package.mk

define Package/netmonitor
  SECTION:=net
  CATEGORY:=Network
  TITLE:=Domestic/international network connectivity monitor
  DEPENDS:=+curl +sqlite3-cli +jsonfilter
  PKGARCH:=all
endef

define Package/netmonitor/description
  Periodically checks domestic (baidu.com) and international (google.com,
  via the default route / OpenClash proxy) connectivity using ping and
  HTTP probes. Results are stored in SQLite and exposed to LuCI via rpcd.
endef

define Package/netmonitor/conffiles
/etc/config/netmonitor
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
endef

define Build/Configure
endef

define Build/Compile
endef

define Package/netmonitor/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/netmonitor $(1)/usr/bin/
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/netmonitor $(1)/etc/init.d/
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/netmonitor $(1)/etc/config/netmonitor
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./files/usr/libexec/rpcd/netmonitor $(1)/usr/libexec/rpcd/
endef

$(eval $(call BuildPackage,netmonitor))

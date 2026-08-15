include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-netmonitor
PKG_VERSION:=$(if $(NM_BUILD_VERSION),$(NM_BUILD_VERSION),1.0.0)
PKG_RELEASE:=1
PKG_LICENSE:=MIT
PKG_MAINTAINER:=lnwu

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-netmonitor
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=LuCI Support for netmonitor
  DEPENDS:=+luci-base +rpcd +netmonitor
  PKGARCH:=all
endef

define Package/luci-app-netmonitor/description
  LuCI front-end for netmonitor: realtime connectivity status and
  daily network fluctuation history charts.
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
endef

define Build/Configure
endef

define Build/Compile
endef

define Package/luci-app-netmonitor/install
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/netmonitor
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/netmonitor/*.js \
		$(1)/www/luci-static/resources/view/netmonitor/
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/
endef

$(eval $(call BuildPackage,luci-app-netmonitor))

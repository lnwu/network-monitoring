'use strict';
'require view';
'require form';

return view.extend({
	title: _('Network Monitor Settings'),

	render: function() {
		var m, s, o;

		m = new form.Map('netmonitor', _('Network Monitor Settings'),
			_('Targets and timing for the connectivity monitor. Changes take effect on the next check cycle.'));

		s = m.section(form.NamedSection, 'main', 'netmonitor', _('General'));

		o = s.option(form.Value, 'interval', _('Check interval (seconds)'));
		o.placeholder = '1';
		o.datatype = 'and(uinteger,min(1),max(86400))';

		o = s.option(form.Value, 'retention', _('Data retention (days)'));
		o.placeholder = '7';
		o.datatype = 'and(uinteger,min(1),max(366))';

		o = s.option(form.Value, 'ping_count', _('Ping count per check'));
		o.placeholder = '3';
		o.datatype = 'and(uinteger,min(1),max(10))';

		o = s.option(form.Value, 'timeout', _('HTTP timeout (seconds)'));
		o.placeholder = '8';
		o.datatype = 'and(uinteger,min(2),max(60))';

		o = s.option(form.Flag, 'log_all', _('Log every check cycle'),
			_('When disabled, only state changes are written to the system log.'));
		o.rmempty = false;
		o.default = '0';

		o = s.option(form.Value, 'cn_http_target', _('Domestic HTTP target'));
		o.placeholder = 'https://www.baidu.com';

		o = s.option(form.Value, 'cn_ping_target', _('Domestic ping target'));
		o.placeholder = 'baidu.com';

		o = s.option(form.Value, 'intl_http_target', _('International HTTP target (via proxy)'));
		o.placeholder = 'https://www.google.com/generate_204';

		o = s.option(form.Value, 'intl_ping_target', _('International ping target (IP, usually not proxied)'));
		o.placeholder = '8.8.8.8';

		o = s.option(form.Flag, 'direct_enabled', _('Enable direct international reference check'),
			_('Tries to reach an international target by binding to the WAN interface. This does not guarantee bypassing transparent proxies. ' +
				'From mainland China this may always fail depending on the line; useful as a reference only.'));

		o = s.option(form.Value, 'direct_http_target', _('Direct check HTTP target'));
		o.placeholder = 'https://www.cloudflare.com/cdn-cgi/trace';
		o.depends('direct_enabled', '1');

		o = s.option(form.Value, 'wan_interface', _('WAN interface for direct check'),
			_('Leave as "auto" to detect automatically (e.g. pppoe-wan).'));
		o.placeholder = 'auto';
		o.depends('direct_enabled', '1');

		return m.render();
	}
});

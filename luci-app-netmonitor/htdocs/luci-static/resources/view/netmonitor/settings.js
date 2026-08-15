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

		o = s.option(form.Value, 'timeout', _('HTTP timeout (seconds)'));
		o.placeholder = '8';
		o.datatype = 'and(uinteger,min(2),max(60))';

		o = s.option(form.Value, 'cn_http_target', _('Domestic HTTP target'));
		o.placeholder = 'https://www.baidu.com';

		o = s.option(form.Value, 'intl_http_target', _('International HTTP target (via proxy)'));
		o.placeholder = 'https://www.google.com/generate_204';

		return m.render();
	}
});

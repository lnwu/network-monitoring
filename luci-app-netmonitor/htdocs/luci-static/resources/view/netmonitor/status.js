'use strict';
'require view';
'require rpc';
'require uci';
'require poll';

var callStatus = rpc.declare({ object: 'netmonitor', method: 'status' });

return view.extend({
	title: _('Network Status'),

	load: function() {
		return Promise.all([
			L.resolveDefault(callStatus(), null),
			uci.load('netmonitor').then(function() {
				return { main: uci.get('netmonitor', 'main') || {} };
			})
		]);
	},

	render: function(data) {
		var cfg = (data[1] && data[1].main) || {};
		var cnTarget = cfg.cn_ping_target || 'baidu.com';
		var intlTarget = cfg.intl_ping_target || '8.8.8.8';
		var directEnabled = cfg.direct_enabled === '1';
		var container = E('div');
		var grid = E('div', { 'style': 'display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px' });

		container.appendChild(E('h2', {}, _('Realtime Connectivity')));
		container.appendChild(grid);

		function card(name, state, lines) {
			var color = (state === 1) ? '#3c9248' : (state === 0) ? '#d9534f' : '#999';
			var el = E('div', { 'class': 'cbi-section', 'style': 'padding:12px 14px;border-left:4px solid ' + color },
				E('h4', { 'style': 'margin:0 0 8px;font-size:15px' }, name));
			lines.forEach(function(l) {
				el.appendChild(E('div', { 'style': 'font-size:13px;line-height:1.7;color:#555' }, l));
			});
			return el;
		}

		function draw(s) {
			grid.innerHTML = '';

			if (!s || !s.ts) {
				grid.appendChild(E('div', { 'class': 'cbi-section' },
					_('No data yet. Make sure the netmonitor service is running.')));
				return;
			}

			var t = new Date(s.ts * 1000).toLocaleString();

			grid.appendChild(card(_('Domestic (%s)').format(cnTarget), +s.cn_ok, [
				_('HTTP status: %s (%ss)').format(s.cn_http_code, (+s.cn_http_time).toFixed(2)),
				_('Ping: %s ms, loss: %s%%').format((+s.cn_ping > 0) ? (+s.cn_ping).toFixed(1) : '-', s.cn_loss),
				_('Checked at: %s').format(t)
			]));

			grid.appendChild(card(_('International via proxy'), +s.intl_ok, [
				_('HTTP status: %s (%ss)').format(s.intl_http_code, (+s.intl_http_time).toFixed(2)),
				_('Ping %s: %s ms, loss: %s%% (ICMP, usually not proxied)').format(intlTarget, (+s.intl_ping > 0) ? (+s.intl_ping).toFixed(1) : '-', s.intl_loss),
				_('Checked at: %s').format(t)
			]));

			if (directEnabled) {
				var directChecked = s.direct_checked == null || +s.direct_checked === 1;
				grid.appendChild(card(_('International direct (WAN interface reference)'), directChecked ? +s.direct_ok : -1,
					directChecked ? [
						_('HTTP status: %s (%ss)').format(s.direct_http_code, (+s.direct_http_time).toFixed(2)),
						_('May always fail from mainland China; reference only')
					] : [ _('Direct check unavailable') ]));
			}

			var verdict, vok;
			if (+s.cn_ok === 0) {
				verdict = _('Broadband / modem link appears DOWN');
				vok = 0;
			}
			else if (+s.intl_ok === 0) {
				if (directEnabled && +s.direct_ok === 1) {
					verdict = _('Domestic OK, international DOWN, but direct link works - proxy (OpenClash) likely dead');
				}
				else {
					verdict = _('Domestic OK, international DOWN - proxy or international route issue');
				}
				vok = 0;
			}
			else {
				verdict = _('All connections healthy');
				vok = 1;
			}

			grid.appendChild(card(_('Verdict'), vok, [ verdict ]));
		}

		draw(data[0]);

		var pollFn = function() {
			if (!document.contains(container)) {
				poll.remove(pollFn);
				return null;
			}
			return L.resolveDefault(callStatus(), {}).then(draw);
		};
		poll.add(pollFn, 10);

		return container;
	}
});

'use strict';
'require view';
'require rpc';
'require poll';

var callStatus = rpc.declare({ object: 'netmonitor', method: 'status' });

return view.extend({
	title: _('Network Status'),

	load: function() {
		return L.resolveDefault(callStatus(), null);
	},

	render: function(data) {
		var container = E('div');
		var grid = E('div', { 'style': 'display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px' });

		container.appendChild(E('h2', {}, _('Realtime Connectivity')));
		container.appendChild(grid);

		function card(name, state, latency) {
			var color = (state === 1) ? '#3c9248' : (state === 0) ? '#d9534f' : '#999';
			var el = E('div', { 'class': 'cbi-section', 'style': 'padding:12px 14px;border-left:4px solid ' + color },
				E('h4', { 'style': 'margin:0 0 8px;font-size:15px' }, name));
			var value = (state === 1 && latency != null && isFinite(+latency)) ?
				_('Latency: %s ms').format((+latency).toFixed(1)) :
				(state === 0 ? _('Latency: -') : _('No data'));
			el.appendChild(E('div', { 'style': 'font-size:16px;line-height:1.7;color:#555' }, value));
			return el;
		}

		function draw(s) {
			grid.innerHTML = '';
			grid.appendChild(card(_('Domestic'), s ? +s.cn_ok : -1, s && s.cn_latency_ms));
			grid.appendChild(card(_('Foreign'), s ? +s.intl_ok : -1, s && s.intl_latency_ms));
		}

		draw(data);

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

'use strict';
'require view';
'require rpc';

var callDays = rpc.declare({ object: 'netmonitor', method: 'days' });
var callHistory = rpc.declare({ object: 'netmonitor', method: 'history', params: [ 'date' ] });

return view.extend({
	title: _('Network History'),

	load: function() {
		return L.resolveDefault(callDays(), { days: [] });
	},

	render: function(data) {
		var self = this;
		var days = (data && data.days) ? data.days : [];
		var loadSerial = 0;

		var container = E('div');

		/* ---------- day picker ---------- */
		var summaryBox = E('div', { 'style': 'display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:12px 0' });
		var chartBox = E('div', { 'class': 'cbi-section', 'style': 'padding:8px' });
		var message = E('div');

		function localDateStr(d) {
			var p = function(n) { return (n < 10 ? '0' : '') + n; };
			return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
		}

		var todayStr = (data && data.today) || localDateStr(new Date());

		function shiftDate(d, delta) {
			var t = new Date(d + 'T00:00:00');
			t.setDate(t.getDate() + delta);
			var p = function(n) { return (n < 10 ? '0' : '') + n; };
			return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate());
		}

		function loadDay(d) {
			var serial = ++loadSerial;
			L.resolveDefault(callHistory(d), {}).then(function(res) {
				if (serial !== loadSerial) return;
				renderDay(d, (res && res.samples) ? res.samples : [], +((res && res.interval) || 30));
			});
		}

		function statCard(label, value, cls) {
			return E('div', { 'class': 'cbi-section', 'style': 'padding:10px 12px' }, [
				E('div', { 'style': 'font-size:12px;color:#888' }, label),
				E('div', { 'style': 'font-size:18px;font-weight:bold' }, value)
			]);
		}

		function fmtDur(v) {
			if (v == null || isNaN(+v)) return '-';
			v = Math.round(+v);
			if (v < 60) return v + 's';
			var m = Math.floor(v / 60), s = v % 60;
			if (m < 60) return s ? m + 'm ' + s + 's' : m + 'm';
			var h = Math.floor(m / 60);
			return h + 'h ' + (m % 60) + 'm';
		}

		function renderDay(date, samples, interval) {
			summaryBox.innerHTML = '';
			chartBox.innerHTML = '';
			message.innerHTML = '';

			if (!samples.length) {
				message.appendChild(E('p', { 'class': 'cbi-section' },
					_('No samples recorded for %s.').format(date)));
				return;
			}

			var cnOk = 0, intlOk = 0, cnSum = 0, cnCnt = 0, cnMax = 0,
				intlSum = 0, intlCnt = 0, intlMax = 0,
				cnDown = 0, intlDown = 0, cnOut = 0, intlOut = 0,
				cnDownSecs = 0, intlDownSecs = 0;

			function sampleDuration(s, i) {
				var sampleInterval = +s.sample_interval;
				if (!(sampleInterval > 0)) sampleInterval = interval;
				if (i + 1 < samples.length) {
					var next = +samples[i + 1].ts - +s.ts;
					return next > 0 ? Math.min(next, sampleInterval) : 0;
				}
				return Math.min(sampleInterval, Math.max(0, Math.floor(Date.now() / 1000) - +s.ts));
			}

			samples.forEach(function(s, i) {
				var c = +s.cn_ok, it = +s.intl_ok;
				var duration = sampleDuration(s, i);
				if (c) cnOk++; else cnDown++;
				if (it) intlOk++; else intlDown++;
				if (i > 0) {
					if (!c && +samples[i - 1].cn_ok) cnOut++;
					if (!it && +samples[i - 1].intl_ok) intlOut++;
				} else {
					if (!c && +s.prev_cn_ok) cnOut++;
					if (!it && +s.prev_intl_ok) intlOut++;
				}
				if (!c) cnDownSecs += duration;
				if (!it) intlDownSecs += duration;
				if (c && +s.cn_ping > 0) { cnSum += +s.cn_ping; cnCnt++; if (+s.cn_ping > cnMax) cnMax = +s.cn_ping; }
				if (it && +s.intl_ping > 0) { intlSum += +s.intl_ping; intlCnt++; if (+s.intl_ping > intlMax) intlMax = +s.intl_ping; }
			});

			summaryBox.appendChild(statCard(_('Domestic availability'), (100 * cnOk / samples.length).toFixed(1) + '%'));
			summaryBox.appendChild(statCard(_('International availability'), (100 * intlOk / samples.length).toFixed(1) + '%'));
			summaryBox.appendChild(statCard(_('Domestic latency (avg / max)'),
				(cnCnt ? (cnSum / cnCnt).toFixed(1) : '-') + ' / ' + (cnMax ? cnMax.toFixed(1) : '-') + ' ms'));
			summaryBox.appendChild(statCard(_('International latency (avg / max)'),
				(intlCnt ? (intlSum / intlCnt).toFixed(1) : '-') + ' / ' + (intlMax ? intlMax.toFixed(1) : '-') + ' ms'));
			summaryBox.appendChild(statCard(_('Outages (domestic / international)'),
				'%s (%s) / %s (%s)'.format(cnOut, fmtDur(cnDownSecs), intlOut, fmtDur(intlDownSecs))));

			chartBox.innerHTML = chartSVG(samples);
		}

		function chartSVG(samples) {
			var W = 960, H = 300, padL = 48, padR = 12, padT = 14, padB = 28;
			var maxV = 100;

			samples.forEach(function(s) {
				if (+s.cn_ping > maxV) maxV = +s.cn_ping;
				if (+s.intl_ping > maxV) maxV = +s.intl_ping;
			});
			maxV = Math.min(Math.ceil(maxV * 1.15 / 50) * 50, 3000);

			function secOfDay(ts) {
				var d = new Date(ts * 1000);
				return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
			}
			function x(ts) { return padL + (secOfDay(ts) / 86400) * (W - padL - padR); }
			function y(v) { return padT + (1 - Math.min(v, maxV) / maxV) * (H - padT - padB); }

			var p = [];

			/* outage bars */
			samples.forEach(function(s) {
				if (+s.cn_ok === 0 || +s.intl_ok === 0) {
					p.push('<rect x="' + (x(s.ts) - 0.5).toFixed(2) + '" y="' + padT +
						'" width="1.6" height="' + (H - padT - padB) + '" fill="rgba(217,83,79,0.4)"/>');
				}
			});

			/* grid + axis labels */
			for (var i = 0; i <= 4; i++) {
				var v = maxV * i / 4, gy = y(v);
				p.push('<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy +
					'" stroke="#ddd" stroke-width="1"/>');
				p.push('<text x="' + (padL - 6) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="11" fill="#888">' + Math.round(v) + '</text>');
			}
			[0, 6, 12, 18, 24].forEach(function(h) {
				var gx = padL + (h * 3600 / 86400) * (W - padL - padR);
				p.push('<line x1="' + gx + '" y1="' + padT + '" x2="' + gx + '" y2="' + (H - padB) + '" stroke="#eee" stroke-width="1"/>');
				p.push('<text x="' + gx + '" y="' + (H - padB + 16) + '" text-anchor="middle" font-size="11" fill="#888">' + (h < 10 ? '0' : '') + h + ':00</text>');
			});

			function line(color, okField, valField) {
				var pts = [];
				samples.forEach(function(s) {
					var v = +s[valField];
					if (+s[okField] === 1 && v > 0)
						pts.push(x(s.ts).toFixed(2) + ',' + y(v).toFixed(2));
				});
				return pts.length ? '<polyline fill="none" stroke="' + color + '" stroke-width="1.4" points="' + pts.join(' ') + '"/>' : '';
			}

			p.push(line('#2e6da4', 'cn_ok', 'cn_ping'));
			p.push(line('#3c9248', 'intl_ok', 'intl_ping'));

			/* legend */
			p.push('<line x1="' + (W - 260) + '" y1="6" x2="' + (W - 240) + '" y2="6" stroke="#2e6da4" stroke-width="3"/>' +
				'<text x="' + (W - 234) + '" y="10" font-size="11" fill="#555">' + _('Domestic') + '</text>');
			p.push('<line x1="' + (W - 170) + '" y1="6" x2="' + (W - 150) + '" y2="6" stroke="#3c9248" stroke-width="3"/>' +
				'<text x="' + (W - 144) + '" y="10" font-size="11" fill="#555">' + _('International') + '</text>');
			p.push('<rect x="' + (W - 60) + '" y="2" width="10" height="8" fill="rgba(217,83,79,0.5)"/>' +
				'<text x="' + (W - 46) + '" y="10" font-size="11" fill="#555">' + _('Outage') + '</text>');

			return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">' + p.join('') + '</svg>';
		}

		/* ---------- controls ---------- */
		var dateInput = E('input', {
			type: 'date',
			value: todayStr,
			style: 'padding:4px 8px',
			change: function(ev) {
				if (ev.target.value) loadDay(ev.target.value);
			}
		});

		var controls = E('div', { 'style': 'display:flex;gap:8px;align-items:center' }, [
			E('button', {
				'class': 'btn cbi-button',
				click: function() {
					var d = shiftDate(dateInput.value, -1);
					dateInput.value = d;
					loadDay(d);
				}
			}, '←'),
			dateInput,
			E('button', {
				'class': 'btn cbi-button',
				click: function() {
					var d = shiftDate(dateInput.value, 1);
					dateInput.value = d;
					loadDay(d);
				}
			}, '→')
		]);

		container.appendChild(E('h2', {}, _('Daily Network Fluctuation')));
		container.appendChild(controls);
		container.appendChild(summaryBox);
		container.appendChild(E('h3', {}, _('Latency (ms, local time of day)')));
		container.appendChild(chartBox);
		container.appendChild(message);

		/* ---------- all-days table ---------- */
		var table = E('table', { 'class': 'table', 'style': 'margin-top:16px' });
		table.appendChild(E('tr', { 'class': 'tr table-titles' }, [
			E('th', { 'class': 'th' }, _('Date')),
			E('th', { 'class': 'th' }, _('Domestic avail.')),
			E('th', { 'class': 'th' }, _('Intl. avail.')),
			E('th', { 'class': 'th' }, _('Domestic avg/max (ms)')),
			E('th', { 'class': 'th' }, _('Intl. avg/max (ms)')),
			E('th', { 'class': 'th' }, _('Outages (domestic)')),
			E('th', { 'class': 'th' }, _('Outages (intl.)'))
		]));

		days.forEach(function(d) {
			var pct = function(v) { return (v == null) ? '-' : v + '%'; };
			var num = function(v) { return (v == null) ? '-' : v; };
			var row = E('tr', { 'class': 'tr', 'style': 'cursor:pointer', click: function() {
				dateInput.value = d.day;
				loadDay(d.day);
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}});
			[d.day, pct(d.cn_avail), pct(d.intl_avail),
				num(d.cn_avg) + ' / ' + num(d.cn_max), num(d.intl_avg) + ' / ' + num(d.intl_max),
				'%s (%s)'.format(num(d.cn_outages), fmtDur(d.cn_down_secs)),
				'%s (%s)'.format(num(d.intl_outages), fmtDur(d.intl_down_secs))
			].forEach(function(v) {
				row.appendChild(E('td', { 'class': 'td' }, String(v)));
			});
			table.appendChild(row);
		});

		container.appendChild(E('h3', {}, _('All Recorded Days')));
		container.appendChild(days.length ? table : E('p', {}, _('No recorded days yet.')));

		loadDay(todayStr);

		return container;
	}
});

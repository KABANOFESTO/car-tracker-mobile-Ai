import { DriverInsight, FeedStats, FeedSummary } from '@/constants/types';

export type ReportExportFormat = 'csv' | 'pdf';

export interface ReportExportPayload {
  summaries: FeedSummary[];
  driverInsights: DriverInsight[];
  stats: FeedStats;
  periodLabel: string;
  scopeLabel: string;
  vehicleLabel?: string | null;
}

export function formatReportPeriod(year: number, month: number) {
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

export function createReportFileName(format: ReportExportFormat, year: number, month: number, scope = 'fleet') {
  const safeScope = scope
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'fleet';

  return `fleetpulse-${safeScope}-report-${year}-${String(month).padStart(2, '0')}.${format}`;
}

function escapeCsv(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function toCsvRow(values: unknown[]) {
  return values.map(escapeCsv).join(',');
}

export function buildReportCsv(payload: Pick<ReportExportPayload, 'summaries' | 'periodLabel' | 'scopeLabel'>) {
  const header = [
    'Scope',
    'Period',
    'Vehicle',
    'Date',
    'DistanceKm',
    'MaxSpeedKmh',
    'DurationMinutes',
    'EntryCount',
    'AverageHdop',
    'FenceBreaches',
  ];

  const rows = payload.summaries.map((summary) =>
    toCsvRow([
      payload.scopeLabel,
      payload.periodLabel,
      summary.vehicleName,
      summary.date,
      summary.estimatedDistanceKm.toFixed(2),
      summary.maxSpeed.toFixed(1),
      summary.durationMinutes,
      summary.entryCount,
      summary.avgHdop.toFixed(2),
      summary.fenceBreachCount,
    ])
  );

  if (rows.length === 0) {
    rows.push(
      toCsvRow([
        payload.scopeLabel,
        payload.periodLabel,
        'No records found',
        '',
        '0.00',
        '0.0',
        '0',
        '0',
        '0.00',
        '0',
      ])
    );
  }

  return [toCsvRow(header), ...rows].join('\n');
}

function percent(value: number) {
  return `${Math.max(-999, Math.min(999, value))}%`;
}

function htmlEscape(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSummaryCard(label: string, value: string, detail?: string) {
  return `
    <div class="metric">
      <div class="metric-label">${htmlEscape(label)}</div>
      <div class="metric-value">${htmlEscape(value)}</div>
      ${detail ? `<div class="metric-detail">${htmlEscape(detail)}</div>` : ''}
    </div>
  `;
}

export function buildReportPdfHtml(payload: ReportExportPayload) {
  const summaryRows = payload.summaries.length
    ? payload.summaries.map((summary) => `
      <tr>
        <td>${htmlEscape(summary.vehicleName)}</td>
        <td>${htmlEscape(summary.date)}</td>
        <td>${htmlEscape(summary.estimatedDistanceKm.toFixed(2))} km</td>
        <td>${htmlEscape(summary.maxSpeed.toFixed(1))} km/h</td>
        <td>${htmlEscape(String(summary.durationMinutes))} min</td>
        <td>${htmlEscape(String(summary.entryCount))}</td>
        <td>${htmlEscape(summary.avgHdop.toFixed(2))}</td>
        <td>${htmlEscape(String(summary.fenceBreachCount))}</td>
      </tr>
    `).join('')
    : `<tr><td colspan="8" class="empty">No movement records were found for this period.</td></tr>`;

  const insightRows = payload.driverInsights.length
    ? payload.driverInsights.map((insight) => `
      <tr>
        <td>${htmlEscape(insight.vehicleName)}</td>
        <td>${htmlEscape(insight.driverName)}</td>
        <td>${htmlEscape(insight.totalDistanceKm.toFixed(1))} km</td>
        <td>${htmlEscape(insight.averageSpeedKmh.toFixed(1))} km/h</td>
        <td>${htmlEscape(String(insight.overspeedEvents))}</td>
        <td>${htmlEscape(String(insight.geofenceBreaches))}</td>
        <td>${htmlEscape(String(insight.riskScore))}/100</td>
      </tr>
    `).join('')
    : `<tr><td colspan="7" class="empty">No driver insights available yet.</td></tr>`;

  const totalDistance = payload.stats.totalDistanceKm.toFixed(1);
  const maxSpeed = payload.stats.maxSpeedKmh.toFixed(1);
  const dayCount = String(payload.stats.dayCount);
  const breachDays = String(payload.stats.fenceBreachDays);
  const distanceChange = percent(payload.stats.distanceChange);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          @page { margin: 20px; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #102033;
            background: #f6f8fc;
            margin: 0;
            padding: 20px;
          }
          .page {
            max-width: 1100px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e1e8f2;
            border-radius: 18px;
            padding: 24px;
          }
          .eyebrow {
            text-transform: uppercase;
            letter-spacing: 1.8px;
            font-size: 11px;
            color: #5e7088;
            font-weight: 700;
          }
          h1 {
            margin: 8px 0 6px;
            font-size: 28px;
          }
          .subtitle {
            margin: 0 0 18px;
            color: #5e7088;
            font-size: 13px;
            line-height: 1.5;
          }
          .metrics {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 12px;
            margin: 18px 0 22px;
          }
          .metric {
            border: 1px solid #e1e8f2;
            border-radius: 14px;
            padding: 14px;
            background: linear-gradient(180deg, #fbfdff, #f5f9ff);
          }
          .metric-label {
            font-size: 11px;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #5e7088;
            font-weight: 700;
          }
          .metric-value {
            margin-top: 8px;
            font-size: 22px;
            font-weight: 800;
            color: #102033;
          }
          .metric-detail {
            margin-top: 4px;
            color: #5e7088;
            font-size: 12px;
          }
          .section {
            margin-top: 20px;
          }
          .section h2 {
            margin: 0 0 10px;
            font-size: 18px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th, td {
            border-bottom: 1px solid #e1e8f2;
            padding: 10px 8px;
            text-align: left;
            vertical-align: top;
          }
          th {
            color: #5e7088;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.9px;
          }
          tr:nth-child(even) td {
            background: #fbfdff;
          }
          .empty {
            color: #5e7088;
            text-align: center;
            padding: 24px 8px;
          }
          .footer {
            margin-top: 18px;
            color: #5e7088;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="eyebrow">FleetPulse Report</div>
          <h1>${htmlEscape(payload.periodLabel)} ${htmlEscape(payload.scopeLabel)}</h1>
          <p class="subtitle">
            Generated for ${htmlEscape(payload.vehicleLabel ?? 'the full fleet')} with summary data and driver performance insights.
          </p>

          <div class="metrics">
            ${renderSummaryCard('Total Distance', `${totalDistance} km`, 'Fleet movement in the selected period')}
            ${renderSummaryCard('Peak Speed', `${maxSpeed} km/h`, 'Highest observed speed')}
            ${renderSummaryCard('Active Days', dayCount, 'Days with trip history')}
            ${renderSummaryCard('Breach Days', breachDays, 'Days with geofence activity')}
            ${renderSummaryCard('Distance Change', distanceChange, 'Compared with the previous month')}
          </div>

          <div class="section">
            <h2>Daily Replays</h2>
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Date</th>
                  <th>Distance</th>
                  <th>Max Speed</th>
                  <th>Duration</th>
                  <th>Entries</th>
                  <th>Avg HDOP</th>
                  <th>Breaches</th>
                </tr>
              </thead>
              <tbody>${summaryRows}</tbody>
            </table>
          </div>

          <div class="section">
            <h2>Driver Performance Insights</h2>
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Distance</th>
                  <th>Avg Speed</th>
                  <th>Overspeed</th>
                  <th>Breaches</th>
                  <th>Risk Score</th>
                </tr>
              </thead>
              <tbody>${insightRows}</tbody>
            </table>
          </div>

          <div class="footer">
            FleetPulse professional export. All values are pulled directly from the selected ThingSpeak-backed history.
          </div>
        </div>
      </body>
    </html>
  `;
}

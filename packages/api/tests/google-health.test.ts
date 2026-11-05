import { describe, expect, it } from 'vitest';

import { ApiError, googleHealth } from '../src';

type Call = { url: string; body: Record<string, unknown> | undefined; token: string };
type Reply = { status?: number; json?: unknown };

/** The API is external, so requests are checked against its published schema and answered here. */
function stub(reply: (call: Call, attempt: number) => Reply) {
  const calls: Call[] = [];
  const fetchStub = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = init?.headers as Record<string, string>;
    const call: Call = {
      url: String(input),
      body: init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : undefined,
      token: headers.Authorization!.replace('Bearer ', ''),
    };
    calls.push(call);
    const { status = 200, json = {} } = reply(call, calls.length);
    return new Response(JSON.stringify(json), { status });
  }) as typeof fetch;
  return { calls, fetch: fetchStub };
}

const ctx = (fetchStub: typeof fetch) => ({ getToken: async () => 'token', fetch: fetchStub });
const range = { from: new Date(2026, 9, 26), to: new Date(2026, 9, 27) };
const civil = { year: 2026, month: 10, day: 26 };
const civilStartTime = { date: civil };

describe('googleHealth', () => {
  it('shapes the daily activity from rollups', async () => {
    const nine = new Date(2026, 9, 26, 9).toISOString();
    const ten = new Date(2026, 9, 26, 10).toISOString();
    const { calls, fetch } = stub(({ url }) => {
      if (url.includes('/steps/'))
        return {
          json: {
            rollupDataPoints: [
              { startTime: nine, steps: { countSum: '1000' } },
              { startTime: ten, steps: { countSum: '500' } },
              { startTime: ten },
            ],
          },
        };
      if (url.includes('/distance/'))
        return {
          json: { rollupDataPoints: [{ civilStartTime, distance: { millimetersSum: '4900000' } }] },
        };
      if (url.includes('/active-energy-burned/'))
        return {
          json: { rollupDataPoints: [{ civilStartTime, activeEnergyBurned: { kcalSum: 312 } }] },
        };
      if (url.includes('/total-calories/'))
        return {
          json: { rollupDataPoints: [{ civilStartTime, totalCalories: { kcalSum: 2000 } }] },
        };
      return {
        json: {
          rollupDataPoints: [
            {
              civilStartTime,
              activeMinutes: {
                activeMinutesRollupByActivityLevel: [
                  { activityLevel: 'MODERATE', activeMinutesSum: '30' },
                  { activityLevel: 'VIGOROUS', activeMinutesSum: '8' },
                ],
              },
            },
          ],
        },
      };
    });

    const [day] = await googleHealth.readDayActivity(ctx(fetch), range);

    expect(day).toMatchObject({
      day: '2026-10-26',
      steps: 1500,
      distanceM: 4900,
      activeKcal: 312,
      restKcal: 1688,
      activeMinutes: 38,
      intenseMinutes: 8,
    });
    expect(day?.stepsHourly?.[9]).toBe(1000);
    expect(day?.stepsHourly?.[10]).toBe(500);

    const steps = calls.find((c) => c.url.includes('/steps/'))!;
    expect(steps.url).toBe(
      'https://health.googleapis.com/v4/users/me/dataTypes/steps/dataPoints:rollUp',
    );
    expect(steps.body).toEqual({
      range: { startTime: range.from.toISOString(), endTime: range.to.toISOString() },
      windowSize: '3600s',
    });
    const distance = calls.find((c) => c.url.includes('/distance/'))!;
    expect(distance.url).toContain('/dataPoints:dailyRollUp');
    expect(distance.body).toEqual({
      range: { start: { date: civil }, end: { date: { year: 2026, month: 10, day: 27 } } },
      windowSizeDays: 1,
    });
  });

  it('splits long ranges into the 14 days a rollup accepts and follows pages', async () => {
    const { calls, fetch } = stub(({ url, body }) => {
      if (url.includes('/total-calories/') && !body?.pageToken)
        return { json: { rollupDataPoints: [], nextPageToken: 'next' } };
      return { json: { rollupDataPoints: [] } };
    });

    await googleHealth.readDayActivity(ctx(fetch), {
      from: new Date(2026, 9, 1),
      to: new Date(2026, 9, 31),
    });

    const totals = calls.filter((c) => c.url.includes('/total-calories/'));
    // 30 days = 3 chunks, each one followed by a second page because of the stub.
    expect(totals).toHaveLength(6);
    expect(totals[1]?.body?.pageToken).toBe('next');
    expect((totals[2]?.body?.range as { start: { date: unknown } }).start.date).toEqual({
      year: 2026,
      month: 10,
      day: 15,
    });
  });

  it('maps sleep stages in chronological order with the documented filter', async () => {
    const { calls, fetch } = stub(() => ({
      json: {
        dataPoints: [
          {
            sleep: {
              interval: { startTime: '2026-10-26T02:48:00Z', endTime: '2026-10-26T10:00:00Z' },
              stages: [
                { type: 'REM', startTime: '2026-10-26T09:00:00Z', endTime: '2026-10-26T10:00:00Z' },
                {
                  type: 'ASLEEP',
                  startTime: '2026-10-26T04:00:00Z',
                  endTime: '2026-10-26T05:00:00Z',
                },
                {
                  type: 'RESTLESS',
                  startTime: '2026-10-26T03:00:00Z',
                  endTime: '2026-10-26T04:00:00Z',
                },
                {
                  type: 'SLEEP_STAGE_TYPE_UNSPECIFIED',
                  startTime: '2026-10-26T05:00:00Z',
                  endTime: '2026-10-26T06:00:00Z',
                },
              ],
            },
          },
        ],
      },
    }));

    const [night] = await googleHealth.readSleepSessions(ctx(fetch), range);

    expect(night?.stages.map((s) => s.stage)).toEqual(['awake', 'light', 'rem']);
    expect(decodeURIComponent(calls[0]!.url)).toContain(
      `filter=sleep.interval.end_time >= "${range.from.toISOString()}" AND sleep.interval.end_time < "${range.to.toISOString()}"`,
    );
  });

  it('reads hourly heart rate and the daily resting value', async () => {
    const at = new Date(2026, 9, 26, 9).toISOString();
    const { calls, fetch } = stub(({ url }) =>
      url.includes('/heart-rate/')
        ? {
            json: { rollupDataPoints: [{ startTime: at, heartRate: { beatsPerMinuteAvg: 71.5 } }] },
          }
        : {
            json: {
              dataPoints: [{ dailyRestingHeartRate: { date: civil, beatsPerMinute: '58' } }],
            },
          },
    );

    const data = await googleHealth.readHeartRate(ctx(fetch), range);

    expect(data.samples).toEqual([{ at: new Date(at), bpm: 71.5 }]);
    expect(data.resting).toEqual([{ day: '2026-10-26', bpm: 58 }]);
    const resting = calls.find((c) => c.url.includes('/daily-resting-heart-rate/'))!;
    expect(decodeURIComponent(resting.url)).toContain(
      'filter=daily_resting_heart_rate.date >= "2026-10-26" AND daily_resting_heart_rate.date < "2026-10-27"',
    );
  });

  it('treats a scope the user did not grant as no data', async () => {
    const { fetch } = stub(({ url }) =>
      url.includes('/steps/')
        ? {
            json: {
              rollupDataPoints: [
                { startTime: range.from.toISOString(), steps: { countSum: '10' } },
              ],
            },
          }
        : { status: 403 },
    );

    const days = await googleHealth.readDayActivity(ctx(fetch), range);

    expect(days[0]).toMatchObject({ steps: 10, distanceM: null, activeKcal: null });
  });

  it('refreshes the token once when the API rejects it', async () => {
    const forced: (boolean | undefined)[] = [];
    const { calls, fetch } = stub((_call, attempt) =>
      attempt === 1 ? { status: 401 } : { json: { healthUserId: 'abc' } },
    );
    const context = {
      fetch,
      getToken: async (force?: boolean) => {
        forced.push(force);
        return force ? 'fresh' : 'stale';
      },
    };

    await expect(googleHealth.getIdentity(context)).resolves.toEqual({ healthUserId: 'abc' });
    expect(calls.map((c) => c.token)).toEqual(['stale', 'fresh']);
    expect(calls[0]?.url).toBe('https://health.googleapis.com/v4/users/me/identity');
    expect(forced).toEqual([false, true]);
  });

  it('maps failures to stable error codes', async () => {
    const failing = (status: number) => ctx(stub(() => ({ status })).fetch);
    await expect(googleHealth.getIdentity(failing(404))).rejects.toMatchObject({
      code: 'not_found',
    });
    await expect(googleHealth.getIdentity(failing(403))).rejects.toMatchObject({
      code: 'forbidden',
    });
    await expect(googleHealth.getIdentity(failing(429))).rejects.toMatchObject({
      code: 'rate_limited',
    });

    const offline = {
      getToken: async () => 'token',
      fetch: (() => Promise.reject(new TypeError('Network request failed'))) as typeof fetch,
    };
    const error = await googleHealth.getIdentity(offline).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'network' });
  });
});

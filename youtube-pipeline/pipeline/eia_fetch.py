#!/usr/bin/env python3
"""Fetch hourly EIA-930 data (EIA API v2). Uses env EIA_API_KEY or DEMO_KEY."""
import json, os, sys, time, urllib.parse, urllib.request
KEY = os.environ.get("EIA_API_KEY", "DEMO_KEY")
BASE = "https://api.eia.gov/v2/electricity/rto/"

def fetch(route, facets, start, end):
    rows, offset = [], 0
    while True:
        q = [("api_key", KEY), ("frequency", "hourly"), ("data[0]", "value"),
             ("start", start), ("end", end), ("length", "5000"), ("offset", str(offset)),
             ("sort[0][column]", "period"), ("sort[0][direction]", "asc")]
        q += [(f"facets[{k}][]", v) for k, v in facets.items()]
        url = BASE + route + "/data/?" + urllib.parse.urlencode(q)
        for a in range(5):
            try:
                with urllib.request.urlopen(url, timeout=60) as r:
                    res = json.loads(r.read())["response"]
                break
            except Exception as e:
                print("retry", e, file=sys.stderr); time.sleep(10 * (a + 1))
        data = res["data"]
        rows += data
        offset += len(data)
        if not data or offset >= int(res["total"]):
            return rows
        time.sleep(1)

if __name__ == "__main__":
    out = sys.argv[1]
    jobs = {
        "us48_demand_2025": ("region-data", {"respondent": "US48", "type": "D"}, "2025-01-01T05", "2026-01-01T04"),
        "us48_nuclear_2025": ("fuel-type-data", {"respondent": "US48", "fueltype": "NUC"}, "2025-01-01T05", "2026-01-01T04"),
        "spp_wind_2025": ("fuel-type-data", {"respondent": "SWPP", "fueltype": "WND"}, "2025-01-01T06", "2026-01-01T05"),
        "spp_demand_2025": ("region-data", {"respondent": "SWPP", "type": "D"}, "2025-01-01T06", "2026-01-01T05"),
        "ciso_demand_apr2025": ("region-data", {"respondent": "CISO", "type": "D"}, "2025-04-01T07", "2025-05-01T06"),
        "ciso_solar_apr2025": ("fuel-type-data", {"respondent": "CISO", "fueltype": "SUN"}, "2025-04-01T07", "2025-05-01T06"),
        "ciso_wind_apr2025": ("fuel-type-data", {"respondent": "CISO", "fueltype": "WND"}, "2025-04-01T07", "2025-05-01T06"),
    }
    for name, (route, fac, s, e) in jobs.items():
        path = os.path.join(out, name + ".json")
        if os.path.exists(path):
            continue
        rows = fetch(route, fac, s, e)
        json.dump([{"period": r["period"], "value": float(r["value"]) if r["value"] not in (None, "") else None} for r in rows],
                  open(path, "w"))
        print(name, len(rows), flush=True)

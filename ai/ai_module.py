# SAOS AI module: crop-health classification, soil-moisture forecasting and
# predictive (FAO-56) irrigation planning. Run: python ai_module.py
import math
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import (accuracy_score, f1_score, confusion_matrix,
                             classification_report, mean_absolute_error,
                             r2_score)

rng = np.random.default_rng(42)
LAT = math.radians(26.22)                 # Gwalior latitude
FC, WP, ROOT_MM = 38.0, 18.0, 600.0       # loam: field capacity, wilting %
TAW = (FC - WP) / 100 * ROOT_MM           # total available water = 120 mm
RAW = 0.4 * TAW                           # readily available water (p = 0.4)
STAGES = [(25, 0.60), (35, None), (40, 1.15), (20, 0.80)]   # tomato, FAO-56


def kc(day):                               # crop coefficient curve
    ini, dev, mid, late = (s[0] for s in STAGES)
    if day < ini:
        return 0.60
    if day < ini + dev:
        return 0.60 + (1.15 - 0.60) * (day - ini) / dev
    if day < ini + dev + mid:
        return 1.15
    return 1.15 + (0.80 - 1.15) * (day - ini - dev - mid) / late


def ra(doy):                               # extraterrestrial radiation, mm/day
    dr = 1 + 0.033 * math.cos(2 * math.pi * doy / 365)
    dec = 0.409 * math.sin(2 * math.pi * doy / 365 - 1.39)
    ws = math.acos(-math.tan(LAT) * math.tan(dec))
    r = (24 * 60 / math.pi) * 0.0820 * dr * (ws * math.sin(LAT) * math.sin(dec)
        + math.cos(LAT) * math.cos(dec) * math.sin(ws))
    return 0.408 * r


def weather(days=120, start_doy=288):      # season from 15 October
    rows = []
    for d in range(days):
        doy = (start_doy + d - 1) % 365 + 1
        tmax = 31 - 9 * math.sin(math.pi * d / 120) + rng.normal(0, 1.5)
        tmin = tmax - 13 + rng.normal(0, 1.5)
        rain = rng.choice([0, rng.uniform(4, 28)], p=[0.96, 0.04])
        hum = np.clip(55 + 25 * math.sin(math.pi * d / 120) + rain
                      + rng.normal(0, 6), 25, 98)
        et0 = 0.0023 * ra(doy) * ((tmax + tmin) / 2 + 17.8) * math.sqrt(tmax - tmin)
        rows.append(dict(day=d, tmax=tmax, tmin=tmin, hum=hum, rain=rain,
                         et0=et0, kc=kc(d)))
    return pd.DataFrame(rows)


def simulate(w, policy):
    """Daily root-zone water balance. Returns per-day moisture and water used."""
    store, out = TAW, []                   # mm of available water in root zone
    for i, r in w.iterrows():
        theta = WP + store / ROOT_MM * 100
        rain_next = w.rain[i + 1] if i + 1 < len(w) else 0
        irr = policy(r, theta, store, rain_next)
        dep = TAW - store
        ks = 1.0 if dep <= RAW else max(0.0, (TAW - dep) / (TAW - RAW))
        etc = r.kc * r.et0 * ks
        store = store + 0.8 * r.rain + irr - etc
        drain = max(0.0, store - TAW)
        store = min(max(store, 0.0), TAW)
        out.append(dict(day=r.day, theta=theta, irr=irr, etc=etc, drain=drain,
                        stress=ks < 1.0))
    return pd.DataFrame(out)


# ---------------- irrigation policies ----------------
def fixed(r, theta, store, rain_next):     # farmer: 35 mm every 8 days
    return 35.0 if r.day % 8 == 3 else 0.0


def threshold(r, theta, store, rain_next):  # sensor rule: refill below RAW
    return TAW - store if TAW - store > RAW else 0.0


def predictive(r, theta, store, rain_next):  # AI: forecast tomorrow's deficit
    tomorrow = store - r.kc * r.et0 + 0.8 * rain_next
    if TAW - tomorrow > 0.8 * RAW:           # would cross the stress limit
        return max(0.0, 0.85 * TAW - tomorrow)   # leave room for rain
    return 0.0


# ---------------- 1) predictive water management ----------------
season = weather()
res = {n: simulate(season, p) for n, p in
       [("Fixed schedule", fixed), ("Sensor threshold", threshold),
        ("AI predictive", predictive)]}
print("Season: 120 days, tomato, loam soil (TAW = %.0f mm)" % TAW)
print(f"{'Strategy':18s}{'Water (mm)':>11s}{'m3/ha':>8s}{'Drainage':>10s}"
      f"{'Stress days':>13s}")
for n, s in res.items():
    print(f"{n:18s}{s.irr.sum():11.0f}{s.irr.sum() * 10:8.0f}"
          f"{s.drain.sum():10.0f}{int(s.stress.sum()):13d}")
saving = 1 - res["AI predictive"].irr.sum() / res["Fixed schedule"].irr.sum()
print(f"Water saved by AI predictive vs fixed schedule: {saving * 100:.1f} %\n")

# ---------------- 2) soil-moisture forecast (next day) ----------------
rows = []
for k in range(30):                          # 30 simulated seasons
    w = weather()
    pol = [fixed, threshold, predictive][k % 3]
    s = simulate(w, pol)
    f = w.join(s[["theta", "irr"]])
    f["theta_next"] = f.theta.shift(-1)
    f["rain_fc"] = f.rain.shift(-1)          # tomorrow's rain forecast
    f["season"] = k
    rows.append(f.dropna())
data = pd.concat(rows)
X_cols = ["theta", "irr", "tmax", "tmin", "hum", "et0", "kc", "rain_fc"]
tr, te = data[data.season < 24], data[data.season >= 24]
gbr = GradientBoostingRegressor(n_estimators=300, max_depth=3, random_state=0)
gbr.fit(tr[X_cols], tr.theta_next)
pred = gbr.predict(te[X_cols])
mae = mean_absolute_error(te.theta_next, pred)
print(f"Moisture forecast (24 h): MAE = {mae:.2f} %"
      f", R2 = {r2_score(te.theta_next, pred):.3f}\n")

# ---------------- 3) crop-health classification ----------------
n = 6000
t = pd.DataFrame(dict(moisture=rng.uniform(12, 45, n), ph=rng.uniform(4.8, 8.6, n),
                      tds=rng.uniform(150, 1600, n), temp=rng.uniform(10, 44, n),
                      hum=rng.uniform(25, 99, n)))
def label(r):                                # agronomist rules (tomato)
    if r.moisture < 22: return "Water stress"
    if r.temp > 36: return "Heat stress"
    if r.ph < 5.8 or r.ph > 7.6: return "pH imbalance"
    if r.tds < 400: return "Nutrient deficiency"
    if r.hum > 88 and 18 <= r.temp <= 30: return "Disease risk"
    return "Healthy"
y = t.apply(label, axis=1)
noisy = t + rng.normal(0, [1.2, 0.12, 40, 0.6, 2.5], (n, 5))   # sensor noise
Xtr, Xte, ytr, yte = train_test_split(noisy, y, test_size=0.25, random_state=1,
                                      stratify=y)
rf = RandomForestClassifier(n_estimators=200, random_state=0).fit(Xtr, ytr)
yp = rf.predict(Xte)
print(f"Crop-health classifier: accuracy = {accuracy_score(yte, yp) * 100:.1f} %"
      f", macro F1 = {f1_score(yte, yp, average='macro'):.3f}")
print(classification_report(yte, yp, digits=2))
print("Feature importance:", ", ".join(f"{c} {v:.2f}" for c, v in
      sorted(zip(t.columns, rf.feature_importances_), key=lambda x: -x[1])))

# ---------------- figures ----------------
plt.rcParams["font.family"] = "Times New Roman"
col = {"Fixed schedule": "#eb6834", "Sensor threshold": "#1baf7a",
       "AI predictive": "#2a78d6"}
fig, (a1, a2) = plt.subplots(1, 2, figsize=(10, 4.2),
                             gridspec_kw={"width_ratios": [1.7, 1]})
for nme, s in res.items():
    a1.plot(s.day, s.theta, color=col[nme], lw=1.5, label=nme)
a1.axhline(WP + (TAW - RAW) / ROOT_MM * 100, color="#8a8984", ls="--", lw=1)
a1.text(1, WP + (TAW - RAW) / ROOT_MM * 100 + 0.4, "stress limit", fontsize=8.5)
a1.set(xlabel="Day after transplanting", ylabel="Soil moisture (% vol.)",
       title="(a) Root-zone moisture")
a1.legend(fontsize=8.5, frameon=False, ncol=3, loc="upper center",
           bbox_to_anchor=(0.5, -0.2))
names = list(res)
vals = [res[k].irr.sum() for k in names]
a2.bar(range(3), vals, color="#2a78d6", width=0.6)
for i, v in enumerate(vals):
    a2.text(i, v + 8, f"{v:.0f} mm", ha="center", fontsize=9)
a2.set_xticks(range(3), ["Fixed", "Threshold", "AI"])
a2.set(ylabel="Irrigation water (mm)", title="(b) Seasonal water use")
for a in (a1, a2):
    a.grid(color="#e4e3df", lw=0.6); a.set_axisbelow(True)
    a.spines[["top", "right"]].set_visible(False)
fig.tight_layout(); fig.savefig("water_management.png", dpi=200)

fig, ax = plt.subplots(figsize=(8, 3.4))
seg = te[te.season == 24]
ax.plot(seg.day, seg.theta_next, color="#8a8984", lw=2, label="Measured")
ax.plot(seg.day, gbr.predict(seg[X_cols]), color="#2a78d6", lw=1.5, ls="--",
        label="Predicted (24 h ahead)")
ax.set(xlabel="Day", ylabel="Soil moisture (% vol.)",
       title="Soil-moisture forecast on an unseen season")
ax.legend(fontsize=9, frameon=False); ax.grid(color="#e4e3df", lw=0.6)
ax.spines[["top", "right"]].set_visible(False)
fig.tight_layout(); fig.savefig("moisture_forecast.png", dpi=200)

labels = sorted(y.unique())
cm = confusion_matrix(yte, yp, labels=labels)
fig, ax = plt.subplots(figsize=(6.4, 5))
ax.imshow(cm, cmap="Blues")
ax.set_xticks(range(len(labels)), labels, rotation=35, ha="right")
ax.set_yticks(range(len(labels)), labels)
for i in range(len(labels)):
    for j in range(len(labels)):
        ax.text(j, i, cm[i, j], ha="center", va="center", fontsize=9,
                color="white" if cm[i, j] > cm.max() / 2 else "black")
ax.set(xlabel="Predicted class", ylabel="True class",
       title="Crop-health classifier - confusion matrix")
fig.tight_layout(); fig.savefig("confusion_matrix.png", dpi=200)

# 4-Cylinder Aero-Diesel Engine — Dimensions & Connectivity Reference

## How to read this document

Two different kinds of numbers appear below — don't treat them the same:

- **Confirmed** — read directly off your assembly drawing / CAD (bore, rod length, journal diameters, pin size, ring pack). These are real.
- **Estimated (typical for class)** — TAPAS-BH's exact internal dimensions for the block, head, turbo, fuel system, PSRU, etc. are not publicly published (understandably, for a DRDO program). These values are realistic engineering estimates for a 2.2 L, 4-cylinder turbodiesel of this bore/stroke, based on comparable production and aero-diesel engines. Use them as sane starting points for your CAD, not as certified TAPAS-BH specifications.

**⚠️ One thing to check on your own drawing before you build the block:** your rod dimension reads as 201.20 mm. If that's the true pin-center-to-pin-center length, the rod ratio (L/R) against a 96 mm stroke works out to ~4.2 — unusually long for this stroke (typical L/R for this class is 3.0–3.5, i.e. ~145–170 mm center distance). If 201.20 mm is instead the rod's overall/extreme length (including both eye radii), the effective center distance is closer to ~160 mm, which fits typical proportions well. Confirm which one it is before you lock in deck height — I've used ~160 mm center distance for the deck-height math below and flagged it everywhere it matters.

---

## 1. Rotating / Reciprocating Assembly — *confirmed from your CAD*

| Part | Key dimensions | Mates to | Interface / fastening |
|---|---|---|---|
| **Crankshaft** | Main journal Ø72 mm · Crank pin Ø54 mm · Overall length pattern ≈ 366 mm (80‑38‑46‑38‑46‑38‑80) | Cylinder Block (mains) · Connecting Rods (pins) · Flywheel · PSRU input | Main journals seat in block main-bearing bores on steel-backed shell bearings, retained by main bearing caps/ladder (typ. M10 cap bolts). Rear flange carries flywheel bolt circle (typ. 6× M10–M12). Front nose carries pulley/damper key or spline. |
| **Connecting Rod** | Big end Ø45 mm (bore, per your dwg) · Small end Ø33.8 mm · Center distance ≈ 160–201 mm (see caution above) | Crank pin (big end) · Piston Pin (small end) · Connecting Rod Cap | Big end clamps around crank pin via **Connecting Rod Cap**, 2× rod bolts (typ. M8). Small end bore is a floating/press fit for the piston pin. |
| **Connecting Rod Cap** | 76 mm width · Ø9 mm bolt holes | Connecting Rod | Bolts to rod with 2× rod bolts through the Ø9 mm holes shown on your drawing; big-end bore only completes (Ø45 mm) once cap is torqued to the rod. |
| **Piston** | Ø85.00 mm OD · 85 mm overall height · pin bore Ø33.8–38.8 mm (per your dwg) | Cylinder Liner (bore) · Piston Pin · Piston Rings | Slides in liner bore on ring-sealed clearance fit (~0.03–0.05 mm typical running clearance). Pin bosses house the piston pin, retained by circlips. |
| **Piston Pin (gudgeon pin)** | Ø33.8 mm × 82 mm long, 2×45° chamfer each end | Piston (bosses) · Connecting Rod (small end) | Floating fit through piston bosses and rod small end; axial retention by circlips in the piston boss grooves. |
| **Piston Rings** (×3 per piston, 12 total) | OD 85 mm · ID 79 mm · ring-land height 7.3 mm ×3 · thickness 4.3 mm | Piston (ring grooves) · Cylinder Liner (bore, sealing surface) | Seated in piston ring grooves; seal by radial spring pressure against the liner wall — no fasteners. |
| **Flywheel** *(not yet in your CAD)* | Est. OD ≈ 300–320 mm, ring-gear on OD for starter | Crankshaft rear flange · PSRU input / clutch | Bolted to crank rear flange, typ. 6–8× M10–M12, dowelled for balance. |

---

## 2. Cylinder Block — *estimated*

| Part | Est. dimensions | Mates to | Interface / fastening |
|---|---|---|---|
| **Cylinder Block (casting)** | Bore pitch ≈ 104 mm · overall length ≈ 440 mm · deck height (crank ℄ to head face) ≈ 245–250 mm | Cylinder Liners · Main bearings/caps · Cylinder Head · Oil Pan · Front cover · PSRU/bell-housing | Head face is machined flat, dowelled, sealed by head gasket, clamped by head bolts. Underside carries main bearing bores/caps. Coolant jacket passages cast in around liner bores. |
| **Cylinder Liners** (×4, wet type) | OD ≈ 93 mm · ID (bore) 85 mm · height ≈ 155 mm | Block (spigot bore) · Piston (running bore) · Head gasket (top face) | Wet liner seated on a lower O-ring/land in the block spigot bore; top flange clamped between block deck and head gasket when head is torqued down. |
| **Main Bearing Caps / girdle** | Bolt spacing to match 72 mm journals | Block · Crankshaft | Typ. M10 cap bolts, often 2 per cap (cross-bolted designs add 2 more from the side). |
| **Front Cover** | Spans block front face | Block · Crank nose (oil seal) · Timing chain | Bolted (typ. M6–M8 perimeter bolts), houses front crank oil seal and timing chain/tensioner. |
| **Core Plugs** | Ø25–40 mm typ. | Block coolant jacket openings | Press-fit, seal casting core holes. |

---

## 3. Cylinder Head & Valvetrain — *estimated*

| Part | Est. dimensions | Mates to | Interface / fastening |
|---|---|---|---|
| **Cylinder Head (casting)** | Length ≈ 440 mm (matches block) · width ≈ 190 mm | Block (deck face) · Valves/guides/seats · Camshafts · Injectors · Rocker cover · Intake/exhaust manifolds | Located on block by dowels, head gasket between, clamped by head bolts (typ. M11–M12, ~3 per cylinder). |
| **Intake Valves** (×8, 2/cyl) | Head Ø ≈ 29 mm · stem Ø ≈ 6 mm · lift ≈ 8–9 mm | Valve seat/guide (head) · Valve spring · Rocker/follower | Stem rides in pressed-in valve guide; seals on pressed valve seat ring; retained by collets on spring retainer. |
| **Exhaust Valves** (×8, 2/cyl) | Head Ø ≈ 25 mm · stem Ø ≈ 6 mm · lift ≈ 8–9 mm | Same as intake | Same as intake. |
| **Valve Springs / Retainers** | OD ≈ 28 mm, ID ≈ 15 mm | Valve stem tip · Head spring seat | Compressed between head spring seat and retainer, locked by collets on the valve stem. |
| **Camshafts** (×2, DOHC) | Journal Ø ≈ 25 mm · base circle Ø ≈ 30 mm | Head (journal bores/caps) · Cam sprocket · Rocker/follower | Runs in head-machined journals + bolted caps (typ. M6). Driven by timing chain off crank sprocket at half crank speed. |
| **Cam Sprockets + Timing Chain** | — | Crank sprocket · Camshaft ends | Chain wraps crank sprocket → cam sprockets, tensioned by a hydraulic/spring tensioner and guides. |
| **Rocker Arms / Hydraulic Tappets** | — | Cam lobe · Valve stem tip | Converts cam lobe rotation into valve lift; hydraulic tappets self-adjust lash. |
| **Head Gasket** | Matches head/block footprint | Block deck ↔ Head | Multi-layer steel gasket, sandwiched, sealed by head bolt clamp load. |
| **Rocker Cover** | Spans head top | Head (perimeter) | Bolted (typ. M6), sealed with a rubber gasket; oil filler cap on top. |

---

## 4. Fuel System (Common Rail) — *estimated*

| Part | Est. dimensions | Mates to | Interface / fastening |
|---|---|---|---|
| **Injectors** (×4) | Body Ø ≈ 19 mm hex · length ≈ 120–140 mm | Cylinder Head (injector bore) · Common Rail (HP line) · Injector wiring | Inserted vertically into head injector bore, copper sealing washer at tip, held by an injector clamp bolted to the head. HP line from rail to injector inlet banjo. |
| **Common Rail** | Tube OD ≈ 22 mm · length ≈ 350–400 mm (spans all 4 injectors) | HP Pump (supply) · Injectors (×4 outlets) · Rail pressure sensor | Mounted on head/block bracket; HP steel tubing in from pump, out to each injector; pressure sensor and relief valve threaded into one end. |
| **High-Pressure Pump** | Envelope ≈ 120 × 100 × 150 mm | Camshaft/timing gear (drive) · Common Rail (HP outlet) · Fuel filter (LP inlet) | Driven off the timing gear train at half crank speed; LP fuel in from filter, HP fuel out to rail. |
| **Fuel Filter / Water Separator** | Ø ≈ 80 mm × 130 mm (spin-on canister) | Lift pump (LP inlet) · HP Pump (LP outlet) | Threaded spin-on canister, typ. M20×1.5 center thread. |
| **Fuel Lines** | LP hose ID ≈ 8 mm · HP tube OD ≈ 6 mm | Tank ↔ Filter ↔ HP Pump ↔ Rail ↔ Injectors | Banjo/flare fittings on HP side; hose clamps on LP side. |

---

## 5. Air Induction & Turbocharging — *estimated*

| Part | Est. dimensions | Mates to | Interface / fastening |
|---|---|---|---|
| **Turbocharger — Compressor housing/wheel** | Wheel Ø ≈ 45–50 mm | Air filter/intake duct (inlet) · Intercooler (outlet) · Center housing (shaft) | Volute bolted to center housing; inlet duct clamped, outlet duct to intercooler clamped/flanged. |
| **Turbocharger — Turbine housing/wheel** | Wheel Ø ≈ 40–45 mm | Exhaust Manifold (inlet flange) · Exhaust outlet (turbine exit) · Center housing (shaft) | Bolted flange to exhaust manifold; common shaft through center housing to compressor wheel. |
| **Center Housing (bearing + VGT mechanism)** | Shaft Ø ≈ 8–10 mm | Compressor wheel · Turbine wheel · Oil feed/drain lines · VGT actuator | Floating journal bearings on shaft; oil feed from block gallery, drain by gravity to pan; VGT actuator linkage rotates vane ring. |
| **VGT Actuator** | Envelope ≈ 60 × 40 × 40 mm | Turbine housing (vane ring linkage) · FADEC (control signal) | Linkage rod to vane ring; electrical/pneumatic connection to FADEC. |
| **Intercooler (charge-air cooler)** | Core ≈ 400 × 150 × 60 mm (airframe duct-sized, likely smaller for a UAV nacelle) | Compressor outlet · Intake Manifold | Inlet/outlet pipes clamped or flanged; mounted in airframe duct. |
| **Intake Manifold** | Runner Ø ≈ 35–40 mm ×4 | Intercooler outlet · Cylinder Head intake ports | Flanged to head intake ports (typ. M8 studs), inlet flanged/clamped to intercooler. |

---

## 6. Exhaust — *estimated*

| Part | Est. dimensions | Mates to | Interface / fastening |
|---|---|---|---|
| **Exhaust Manifold** | Runner Ø ≈ 35–38 mm, flange thickness ≈ 10 mm | Cylinder Head exhaust ports · Turbine housing inlet | Bolted to head (typ. M8 studs/nuts), bolted to turbine inlet flange. |
| **Exhaust Outlet / duct** | Ø matches turbine exit | Turbine housing outlet · Airframe exhaust duct | Clamped or flanged connection. |

---

## 7. Cooling System — *estimated*

| Part | Est. dimensions | Mates to | Interface / fastening |
|---|---|---|---|
| **Water Pump** | Impeller Ø ≈ 55–60 mm, body ≈ 90 × 90 × 70 mm | Block coolant inlet · Drive (belt/chain/gear) | Bolted to block front (typ. M8), driven off timing chain/belt. |
| **Thermostat Housing** | Thermostat Ø ≈ 54 mm | Head coolant outlet · Heat exchanger inlet | Bolted to head outlet, hose to heat exchanger. |
| **Heat Exchanger** (airframe-specific, not an automotive radiator) | Sized to airframe duct | Thermostat outlet · Water pump return | Hose/duct connections per airframe cooling design. |
| **Coolant Hoses** | Main ID ≈ 32 mm, minor circuits ID ≈ 19 mm | Pump ↔ Block ↔ Head ↔ Thermostat ↔ Heat exchanger | Hose clamps at each spigot. |

---

## 8. Lubrication System — *estimated*

| Part | Est. dimensions | Mates to | Interface / fastening |
|---|---|---|---|
| **Oil Pump** (gerotor, crank-driven) | Gerotor OD ≈ 40 mm | Crank nose (drive) · Oil Pan (pickup) · Oil galleries (pressure out) | Driven directly off crank nose or a chain; pickup tube dips into pan sump; pressurizes block/head galleries. |
| **Oil Pickup / Strainer** | — | Oil Pan sump · Oil Pump inlet | Bolted bracket into pan, strainer screen at tube end. |
| **Oil Filter** | Spin-on, Ø ≈ 76 mm × 95 mm, thread ≈ 3/4"-16 UNF | Block filter head (inlet/outlet galleries) | Threaded spin-on canister. |
| **Oil Cooler** (plate type) | ≈ 100 × 100 × 40 mm | Filter head · Coolant circuit (for oil-to-water) | Sandwiched between filter head and block, or inline with coolant hoses. |
| **Oil Pan / Sump** | ≈ 440 × 300 × 120 mm, ~5–6 L capacity | Block underside | Bolted perimeter (typ. M6), gasket or RTV sealed. |

---

## 9. Propulsion Interface — PSRU — *estimated, aero-specific*

| Part | Est. dimensions | Mates to | Interface / fastening |
|---|---|---|---|
| **PSRU Housing** | Envelope ≈ 300 × 300 × 200 mm | Block rear face / bell-housing · Airframe firewall mount | Bolted to block/bell-housing (typ. M10 perimeter bolts). |
| **Input Shaft / Gear** | Shaft Ø ≈ 30–35 mm | Crankshaft rear flange (via flywheel or coupling) | Splined or bolted flange coupling to crank. |
| **Reduction Gear Set** (helical, oil-bath) | Reduction ratio ≈ 0.5:1 (engine turns ~2× prop speed), typical for automotive-derived aero-diesels | Input shaft · Output shaft | Meshed helical gears inside housing, splash/pressure lubricated. |
| **Output Shaft** | Ø ≈ 40–50 mm | Torsional Damper · Prop Flange | Supported on output bearings; carries thrust + torque loads to the propeller. |
| **Torsional Damper Coupling** | OD ≈ 150 mm (rubber "doughnut" type) | Output shaft · Prop Flange | Absorbs torsional vibration between gearbox and prop; bolted both sides. |
| **Prop Flange** | Standard aviation bolt pattern (e.g. AS127-type) | Torsional Damper · Propeller hub | Bolted flange per prop manufacturer's pattern. |

---

## 10. Electrical / FADEC — *estimated*

| Part | Est. dimensions | Mates to | Interface / fastening |
|---|---|---|---|
| **FADEC Unit** (dual-lane) | Envelope ≈ 220 × 160 × 70 mm | Engine Mount Bed / airframe firewall · Wiring Harness | Bolted to a bracket on the mount bed or firewall; connectorized harness to all sensors/actuators. |
| **Sensors** (crank/cam position, MAP/boost, EGT, oil pressure/temp, coolant temp, rail pressure) | Threaded bosses ≈ M12×1.5 or 1/8" NPT typ. | Block / Head / Intake Manifold / Exhaust Manifold / Common Rail (as applicable) | Threaded into machined bosses at each location, wired back to FADEC. |
| **Wiring Harness** | — | FADEC ↔ all sensors/actuators/injectors | Routed and clipped along block/head, connectorized at each device. |
| **Alternator** | Housing Ø ≈ 110 mm | Block bracket · Belt drive | Bolted bracket, belt-driven off crank pulley. |
| **Starter Motor** | Ø ≈ 80 mm × 250 mm | Block/bell-housing · Flywheel ring gear | Bolted to bell-housing, pinion engages flywheel ring gear on start. |

---

## 11. Mounts & Structure — *estimated*

| Part | Est. dimensions | Mates to | Interface / fastening |
|---|---|---|---|
| **Engine Mount Bed** | Sized to airframe nacelle | Block/bell-housing · Airframe structure | Bolted to block (typ. M10–M12, 3–4 points) via Isolator Mounts. |
| **Isolator Mounts** | Ø ≈ 80 mm rubber pucks | Mount Bed ↔ Airframe | Bonded/bolted rubber isolators, damp vibration transfer to the airframe. |

---

## Assembly connectivity — top-down summary

```
Propeller
  └─ Prop Flange
       └─ Torsional Damper
            └─ PSRU Output Shaft
                 └─ PSRU Reduction Gears
                      └─ PSRU Input Shaft
                           └─ Flywheel ── Crankshaft (rear flange)
                                              │
Crankshaft ── main journals ── Cylinder Block (main bearings/caps)
     │                                        │
     ├─ Crank pins ── Connecting Rods ── Rod Caps      Cylinder Block
     │                     │                                │
     │                Small end ── Piston Pin ── Piston     ├─ Cylinder Liners (×4)
     │                                            │           ├─ Oil Pan (+ pickup, pump)
     │                                       Piston Rings     ├─ Front Cover (crank seal, timing chain)
     │                                            │           └─ Cylinder Head (head gasket)
     │                                     Cylinder Liner            │
     │                                                                ├─ Valves + springs + guides + seats
Front nose ── Pulley/Damper ── Belt drive ── Water Pump, Alternator     ├─ Camshafts (×2) + timing chain
                                                                          ├─ Injectors ── Common Rail ── HP Pump ── Fuel Filter
                                                                          ├─ Intake Manifold ── Intercooler ── Compressor (Turbo)
                                                                          ├─ Exhaust Manifold ── Turbine (Turbo) ── Exhaust Outlet
                                                                          └─ Rocker Cover

FADEC ── wiring harness ── all sensors + injectors + VGT actuator (cross-cutting, not a mechanical mate)
Engine Mount Bed ── Isolator Mounts ── Airframe (supports the whole assembly above)
```

---

### Bottom line for your CAD plan

The rotating assembly you've already modeled (crank, rods, pistons, pins, rings) is the one subsystem where every number above is real, not estimated. Everything else in this document is a reasonable engineering starting point for a 2.2 L class turbodiesel — good enough to lay out proportions and mate structure, but you should treat every "estimated" dimension as adjustable once you commit to specific real components (a specific turbo model, injector part number, etc.) rather than as fixed.

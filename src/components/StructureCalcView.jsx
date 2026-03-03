import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import { useLanguage } from '../context/LanguageContext';
import Truss3D from './Truss3D';
import './StructureCalcView.css';
import { inventoryService } from '../services/inventoryService';
import { projectService } from '../services/projectService';
import { useNavigate } from 'react-router-dom';

const styles = `
    .input-field {
        width: 100%;
        padding: 12px 16px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.1);
        background: rgba(255,255,255,0.05);
        color: white;
        margin-top: 5px;
        font-family: inherit;
        font-size: 14px;
        transition: all 0.2s;
    }
    .input-field:focus {
        outline: none;
        border-color: #6366f1;
        background: rgba(255,255,255,0.1);
    }
    .btn-primary {
        width: 100%;
        padding: 14px;
        border-radius: 10px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        border: none;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.1s;
    }
    .btn-primary:active {
        transform: scale(0.98);
    }
    .equipment-overlay {
        position: absolute;
        bottom: 20px;
        left: 20px;
        background: rgba(17, 24, 39, 0.85);
        backdrop-filter: blur(8px);
        padding: 20px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        min-width: 250px;
    }
    .equipment-title {
        font-size: 14px;
        font-weight: 700;
        color: #e5e7eb;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .equipment-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        font-size: 13px;
        color: #9ca3af;
    }
    .equipment-item {
        display: flex;
        justify-content: space-between;
    }
    .equipment-val {
        color: white;
        font-weight: 600;
    }
`;

const TRUSS_SERIES = {
    PT34: {
        name: "PT34 (Standard 290)",
        sectionSize: 0.29,
        weightPerMeter: 4.8,
        tubeSpecs: "50x2 mm",
        maxPointLoad_6m: 688,
        conicalType: "CCS6",
        maxSpan: 12,
        udlLimit: { 4: 390, 8: 130, 12: 53 } // kg/m
    },
    FT44: {
        name: "FT44 (Standard 400)",
        sectionSize: 0.40,
        weightPerMeter: 6.8,
        tubeSpecs: "50x2 mm",
        maxPointLoad_6m: 823,
        conicalType: "CCS7",
        maxSpan: 16,
        udlLimit: { 4: 800, 8: 200, 12: 100, 16: 50 } // Estimate based on HT44 - 10%
    },
    HT44: {
        name: "HT44 (Heavy Duty 400)",
        sectionSize: 0.40,
        sectionWidth: 0.40,
        sectionHeight: 0.40,
        weightPerMeter: 8.2,
        tubeSpecs: "50x3 mm",
        maxPointLoad_6m: 1252,
        conicalType: "CCS7",
        maxSpan: 16,
        isHeavyDuty: true,
        udlLimit: { 4: 901, 8: 243, 12: 112, 16: 61 } // kg/m
    },
    TT104: {
        name: "TT104 (Monumental)",
        sectionSize: 1.01,
        sectionWidth: 0.58,
        sectionHeight: 1.01,
        weightPerMeter: 70,
        tubeSpecs: "60x5 mm",
        maxPointLoad_6m: 5000,
        conicalType: "CCS7-Heavy",
        maxSpan: 40,
        isHeavyDuty: true,
        isMonumental: true,
        udlLimit: { 10: 2000, 20: 1000, 30: 500, 40: 250 } // Massive capacity
    }
};

const SceneCapture = ({ captureRef }) => {
    const { gl, scene, camera } = useThree();

    React.useEffect(() => {
        captureRef.current = {
            capture: (filename) => {
                gl.render(scene, camera);
                const dataUrl = gl.domElement.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = filename;
                link.href = dataUrl;
                link.click();
            }
        };
    }, [gl, scene, camera]);

    return null;
};

const StructureCalcView = () => {
    const { t } = useLanguage();
    const navigate = useNavigate(); // For redirecting to new project

    // Inject Styles
    useEffect(() => {
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);
        return () => document.head.removeChild(styleSheet);
    }, []);

    const captureRef = React.useRef(null);

    // Config State
    const [config, setConfig] = useState({
        structureType: 'grid', // 'grid' or 'goalpost'
        towerType: 'PT34',
        gridTypeL: 'PT34',
        gridTypeW: 'PT34',
        length: 8,
        width: 6,
        height: 6,
        ledWeight: 500
    });

    // View State
    const [viewMode, setViewMode] = useState('3D'); // '3D' or '2D'

    const handleChange = (e) => {
        let val = e.target.value;
        const name = e.target.name;

        if (['towerType', 'gridTypeL', 'gridTypeW', 'structureType'].includes(name)) {
            setConfig({ ...config, [name]: val });
        } else {
            val = parseFloat(val) || 0;
            // Enforce positive values
            if (val < 0) val = 0;
            if (['length', 'width', 'height'].includes(name)) {
                if (val < 1) val = 1;
            }
            setConfig({ ...config, [name]: val });
        }
    };

    // Calculation Logic
    const stats = useMemo(() => {
        const { length, width, height, ledWeight, towerType, gridTypeL, gridTypeW } = config;

        // Parse Inputs for Multi-Span
        const parseSpans = (input) => {
            const str = String(input).replace(/,/g, ' ').trim();
            const parts = str.split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0);
            return parts.length > 0 ? parts : [parseFloat(input) || 0];
        };

        const splitSpans = (spans, maxLimit) => {
            const newSpans = [];
            const limit = maxLimit || 12;
            spans.forEach(span => {
                if (span > limit) {
                    const numSplits = Math.ceil(span / limit);
                    const segLen = parseFloat((span / numSplits).toFixed(2));
                    for (let i = 0; i < numSplits; i++) {
                        newSpans.push(segLen);
                    }
                } else {
                    newSpans.push(span);
                }
            });
            return newSpans;
        };

        // Manual Selection (User requested "pas automatique svp manuel")
        // HYBRID LOGIC: Force Towers to PT34 unless Monumental (TT104)
        const isMonumental = TRUSS_SERIES[towerType]?.isMonumental;
        const actualTowerType = isMonumental ? towerType : 'PT34';
        const towSpec = TRUSS_SERIES[actualTowerType];

        // GRID LOGIC: Auto-switch to HT44 if span > 12m
        // Unless user explicitly chose TT104 (Monumental)
        const getGridType = (inputSpan, currentType) => {
            if (TRUSS_SERIES[currentType]?.isMonumental) return currentType;
            if (inputSpan > 12) return 'HT44'; // Force Heavy Duty for long spans
            return currentType; // Keep user choice if short
        };

        const maxL = Math.max(...parseSpans(length));
        const maxW = Math.max(...parseSpans(width));

        const actualGridTypeL = getGridType(maxL, gridTypeL);
        const actualGridTypeW = getGridType(maxW, gridTypeW);

        const gridSpecL = TRUSS_SERIES[actualGridTypeL];
        const gridSpecW = TRUSS_SERIES[actualGridTypeW];

        const isGoalpost = config.structureType === 'goalpost';

        const rawLen = parseSpans(length);
        const rawWid = parseSpans(width);

        const lenSpans = splitSpans(rawLen, gridSpecL.maxSpan);
        const widSpans = splitSpans(rawWid, gridSpecW.maxSpan);

        // Max Span per axis
        const maxSpanL = gridSpecL.maxSpan || 12;
        const maxSpanW = gridSpecW.maxSpan || 12;

        let numTowers = 0;
        let numBeamsL = 0;
        let numBeamsW = 0;

        if (isGoalpost) {
            numTowers = 2;
            numBeamsL = 1;
            numBeamsW = 0;
        } else {
            const towersL = lenSpans.length + 1;
            const towersW = widSpans.length + 1;
            numTowers = towersL * towersW;
            numBeamsL = towersW; // Number of beams along length is equal to number of width lines
            numBeamsW = towersL; // Number of beams along width is equal to number of length lines
        }

        // --- 2. Segment Calculator ---
        const calcSegments = (dist) => {
            let rem = dist;
            const s3 = Math.floor(rem / 3); rem = parseFloat((rem % 3).toFixed(2));
            const s2 = Math.floor(rem / 2); rem = parseFloat((rem % 2).toFixed(2));
            const s1 = Math.floor(rem / 1); rem = parseFloat((rem % 1).toFixed(2));
            const s05 = (rem >= 0.45) ? 1 : 0;
            return { s3, s2, s1, s05 };
        };

        const numLinesL = lenSpans.length + 1;
        const numLinesW = widSpans.length + 1;

        const calcTowerSegments = (h) => {
            let rem = h;
            let s1_base = 0;
            let s05_base = 0;

            const isInt = Number.isInteger(h);
            const isHalf = Math.abs((h % 1) - 0.5) < 0.1;

            if (isInt && h >= 1) {
                s1_base = 1;
                rem = h - 1;
            } else if (isHalf && h >= 0.5) {
                s05_base = 1;
                rem = h - 0.5;
            }

            const rest = calcSegments(rem);
            return {
                s3: rest.s3,
                s2: rest.s2,
                s1: rest.s1 + s1_base,
                s05: rest.s05 + s05_base
            };
        };

        // Add Beams along Length (L-Axis)
        // There are `numBeamsL` lines, each containing segments for each span in `lenSpans`
        const hgtSegs = calcTowerSegments(height);
        const totals = { s3: 0, s2: 0, s1: 0, s05: 0 };
        lenSpans.forEach(span => {
            const segs = calcSegments(span);
            totals.s3 += segs.s3 * numBeamsL;
            totals.s2 += segs.s2 * numBeamsL;
            totals.s1 += segs.s1 * numBeamsL;
            totals.s05 += segs.s05 * numBeamsL;
        });

        // Add Beams along Width (W-Axis)
        if (!isGoalpost) {
            widSpans.forEach(span => {
                const segs = calcSegments(span);
                totals.s3 += segs.s3 * numBeamsW;
                totals.s2 += segs.s2 * numBeamsW;
                totals.s1 += segs.s1 * numBeamsW;
                totals.s05 += segs.s05 * numBeamsW;
            });
        }

        totals.s3 += hgtSegs.s3 * numTowers;
        totals.s2 += hgtSegs.s2 * numTowers;
        totals.s1 += hgtSegs.s1 * numTowers;
        totals.s05 += hgtSegs.s05 * numTowers;

        // Junctions
        let corners = 0, tJunctions = 0, xJunctions = 0;
        if (isGoalpost) {
            corners = 2;
        } else {
            corners = 4;
            if (numLinesL > 2 || numLinesW > 2) {
                const innerL = Math.max(0, numLinesL - 2);
                const innerW = Math.max(0, numLinesW - 2);
                tJunctions = (innerL * 2) + (innerW * 2);
                xJunctions = innerL * innerW;
            }
        }

        // Outriggers
        const outriggerLen = 2;
        const outriggerSegs = isGoalpost ? calcSegments(outriggerLen) : { s3: 0, s2: 0, s1: 0, s05: 0 };
        const numOutriggers = isGoalpost ? 4 : 0;

        totals.s3 += outriggerSegs.s3 * numOutriggers;
        totals.s2 += outriggerSegs.s2 * numOutriggers;
        totals.s1 += outriggerSegs.s1 * numOutriggers;
        totals.s05 += outriggerSegs.s05 * numOutriggers;

        // Assign additional props to totals
        totals.corners = corners;
        totals.tJunctions = tJunctions;
        totals.xJunctions = xJunctions;
        totals.bases = numTowers;
        totals.hinges = numTowers * 4;

        // 3. Weight Analysis
        const linearMetersL = length * (isGoalpost ? 1 : numLinesW); // Approx totals
        const linearMetersW = width * numLinesL;
        const linearMetersH = height * numTowers;
        const linearMetersOut = outriggerLen * numOutriggers;

        const towerWeight = (linearMetersH + linearMetersOut) * towSpec.weightPerMeter;
        const gridWeight = (linearMetersL * gridSpecL.weightPerMeter) + (linearMetersW * gridSpecW.weightPerMeter);

        const aluWeight = towerWeight + gridWeight;
        // UDL & Safety Calculation
        const calcSafety = (loadKg, span, spec) => {
            if (!spec.udlLimit) return { limit: 1000, status: 'ok', color: '#555555' }; // Default safe

            // Find limit for this span
            const spans = Object.keys(spec.udlLimit).map(Number).sort((a, b) => a - b);
            const validSpan = spans.find(s => s >= span);

            if (!validSpan) return { limit: 0, status: 'critical', color: '#ef4444', isOverLimit: true }; // Exceeds max chart

            const limit = spec.udlLimit[validSpan];
            const loadPerMeter = loadKg / span; // Simplistic UDL check (Total / Length)

            const ratio = loadPerMeter / limit;

            let color = '#555555'; // Standard Grey
            let status = 'ok';

            if (ratio > 1.0) { color = '#ef4444'; status = 'overload'; } // Red
            else if (ratio > 0.9) { color = '#f97316'; status = 'warning'; } // Orange

            return { limit, ratio, color, status };
        };

        // Check L-Spans
        // Divide LED weight roughly per beam meter? Simplified: Total LED / Total Linear Meters
        const totalLinear = (length * numLinesW) + (width * numLinesL);
        const loadPerMeterAvg = ledWeight / (totalLinear || 1);

        // Better: Assumed distributed load per span.
        // We'll pass the color to the grid stats.

        const safeL = calcSafety(loadPerMeterAvg * Math.max(...lenSpans), Math.max(...lenSpans), gridSpecL);
        const safeW = calcSafety(loadPerMeterAvg * Math.max(...widSpans), Math.max(...widSpans), gridSpecW);

        // Override colors based on safety
        const spanColorL = safeL.color;
        const spanColorW = safeW.color;

        // --- 4. Final Aggregation ---
        // (Existing Logic)
        const totalLoad = aluWeight + ledWeight;
        const numPoints = numTowers || 4;
        const pointLoad = totalLoad / numPoints;
        const pointLoadLimit = towSpec.maxPointLoad_6m;
        const loadPercentage = (pointLoad / pointLoadLimit) * 100;

        // Specific Alerts
        const maxInputL = Math.max(...lenSpans);
        const maxInputW = Math.max(...widSpans);
        const spanErrorL = maxInputL > gridSpecL.maxSpan;
        const spanErrorW = maxInputW > gridSpecW.maxSpan; // Fix logic
        const isOverload = pointLoad > pointLoadLimit || spanErrorL || spanErrorW || safeL.status === 'overload' || safeW.status === 'overload';

        const splitL = lenSpans.length > 1;
        const splitW = widSpans.length > 1;

        return {
            totals, aluWeight, totalLoad, pointLoad, isOverload, loadPercentage, pointLoadLimit,
            spec: gridSpecL, // This was missing causing the error!
            towSpec,
            gridSpecL,
            gridSpecW,
            spanErrorL,
            spanErrorW,
            grid: { splitL, splitW, numTowers, isGoalpost, gridSpecL, gridSpecW, lenSpans, widSpans }
        };
    }, [config]);

    // Inventory Check
    const [stockStatus, setStockStatus] = useState(null);

    useEffect(() => {
        const checkStock = async () => {
            // Mock check or real check if inventoryService has simplified 'checkAvailability'
            // For now, we simulate "fetch all" and compare locally
            try {
                const allItems = await inventoryService.getAll();
                // Find IDs for H30-300, H30-200, H30-100
                // For demo, we just check generic names if matched, or mock.
                // Assuming we look for items named "Poutre 3m", "Poutre 2m" or similar
                // Let's assume unlimited for dev, or mock "Available"
                setStockStatus('Available');
            } catch (e) { console.error(e); }
        };
        checkStock();
    }, [stats]);


    return (
        <div className="calc-container" style={{ display: 'flex', flexDirection: 'row', padding: 0, height: 'calc(100vh - 64px)', minHeight: '600px', width: '100%', alignItems: 'stretch', justifyContent: 'flex-start' }}>
            {/* Sidebar Config */}
            <div className="calc-sidebar" style={{ width: '300px', background: '#111827', padding: '20px', borderRight: '1px solid #374151', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h2 style={{ color: 'white', marginBottom: '10px' }}>🔧 {t('structure_calc')}</h2>

                <div className="input-group">
                    <label>{t('struct_type')}</label>
                    <select
                        name="structureType"
                        value={config.structureType}
                        onChange={handleChange}
                        className="input-field"
                        style={{ background: '#1f2937', color: 'white', cursor: 'pointer' }}
                    >
                        <option value="grid">📦 {t('box_grid')}</option>
                        <option value="goalpost">🥅 {t('goalpost')}</option>
                    </select>
                </div>

                <div className="input-group">
                    <label>{t('tower_series')}</label>
                    <select name="towerType" value={config.towerType} onChange={handleChange} className="input-field" style={{ background: '#1f2937', color: 'white' }}>
                        <option value="PT34">PT34 (Std 290)</option>
                        <option value="FT44">FT44 (Std 400)</option>
                        <option value="HT44">HT44 (Hvy 400)</option>
                        <option value="TT104">TT104 (1010)</option>
                    </select>
                </div>

                <div className="input-group">
                    <label>{t('grid_series_l')}</label>
                    <select name="gridTypeL" value={config.gridTypeL} onChange={handleChange} className="input-field" style={{ background: '#1f2937', color: 'white' }}>
                        <option value="PT34">PT34 (Std 290)</option>
                        <option value="FT44">FT44 (Std 400)</option>
                        <option value="HT44">HT44 (Hvy 400)</option>
                        <option value="TT104">TT104 (1010)</option>
                    </select>
                </div>

                <div className="input-group">
                    <label>{t('grid_series_w')}</label>
                    <select name="gridTypeW" value={config.gridTypeW} onChange={handleChange} className="input-field" style={{ background: '#1f2937', color: 'white' }}>
                        <option value="PT34">PT34 (Std 290)</option>
                        <option value="FT44">FT44 (Std 400)</option>
                        <option value="HT44">HT44 (Hvy 400)</option>
                        <option value="TT104">TT104 (1010)</option>
                    </select>
                </div>

                {stats.spec.isHeavyDuty && (
                    <div style={{ background: '#3b82f6', color: 'white', padding: '5px', borderRadius: '4px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                        🛡️ HEAVY DUTY SERIES
                    </div>
                )}

                <div className="input-group">
                    <label>{t('view_mode')}</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            className="btn"
                            style={{
                                flex: 1,
                                background: viewMode === '3D' ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                color: 'white',
                                border: 'none',
                                padding: '8px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                            onClick={() => setViewMode('3D')}
                        >
                            3D Perspective
                        </button>
                        <button
                            className="btn"
                            style={{
                                flex: 1,
                                background: viewMode === '2D' ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                color: 'white',
                                border: 'none',
                                padding: '8px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                            onClick={() => setViewMode('2D')}
                        >
                            2D Plan
                        </button>
                    </div>
                </div>

                <div className="input-group">
                    <label>{t('len')} (m)</label>
                    <input type="number" name="length" value={config.length} onChange={handleChange} className="input-field" />
                </div>
                <div className="input-group">
                    <label>{t('wid')} (m)</label>
                    <input type="number" name="width" value={config.width} onChange={handleChange} className="input-field" />
                </div>
                <div className="input-group">
                    <label>{t('hgt')} (m)</label>
                    <input type="number" name="height" value={config.height} onChange={handleChange} className="input-field" />
                </div>

                <hr style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

                <div className="input-group">
                    <label>{t('load_led')} (kg)</label>
                    <input type="number" name="ledWeight" value={config.ledWeight} onChange={handleChange} className="input-field" />
                </div>

                <div className="stats-panel" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px' }}>
                    <h3 style={{ fontSize: '14px', color: '#94a3b8' }}>{t('load_analysis')} ({config.type})</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>{t('alu_weight')}:</span>
                        <span>{stats.aluWeight.toFixed(0)} kg</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: 'bold', color: 'white' }}>
                        <span>Total Load:</span>
                        <span>{stats.totalLoad.toFixed(0)} kg</span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '8px', background: '#333', borderRadius: '4px', marginBottom: '5px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${stats.loadPercentage}%`,
                            height: '100%',
                            background: stats.isOverload ? '#ef4444' : (stats.loadPercentage > 80 ? '#f59e0b' : '#10b981'),
                            transition: 'width 0.3s'
                        }}></div>
                    </div>

                    <div style={{ padding: '8px', borderRadius: '6px', background: stats.isOverload ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: stats.isOverload ? '#fca5a5' : '#6ee7b7', textAlign: 'center', fontSize: '12px' }}>
                        <div>Point Load: {stats.pointLoad.toFixed(0)} kg / motor</div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>(Limit: {stats.pointLoadLimit} kg)</div>
                        {stats.isOverload && (
                            <div style={{ fontWeight: 'bold', marginTop: '4px' }}>
                                {stats.pointLoad > stats.pointLoadLimit ? `⚠️ ${t('overload')}` : `⚠️ ${t('struct_limit')}`}
                                {stats.spanErrorL && <div style={{ fontSize: '10px' }}>Length span exceeds {stats.gridSpecL.maxSpan}m</div>}
                                {stats.spanErrorW && <div style={{ fontSize: '10px' }}>Width span exceeds {stats.gridSpecW.maxSpan}m</div>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="inventory-status" style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                    {t('stock_status')} ({config.type}): <span style={{ color: stockStatus?.includes('Low') ? '#fbbf24' : '#34d399' }}>{stockStatus || t('checking')}</span>
                </div>

                <button className="btn btn-primary" style={{ marginTop: 'auto' }} onClick={() => {
                    const items = [
                        { name: `${stats.towSpec.name} Tower`, quantity: (stats.totals.s3 + stats.totals.s2 + stats.totals.s1) },
                        { name: `${stats.gridSpecL.name} Grid (L)`, quantity: (stats.totals.s3 + stats.totals.s2 + stats.totals.s1) },
                        { name: `${stats.gridSpecL.name} Junctions`, quantity: stats.totals.corners + stats.totals.tJunctions + stats.totals.xJunctions },
                        { name: 'Base Plate', quantity: stats.totals.bases },
                        { name: 'Manchon Charnière', quantity: stats.totals.hinges },
                        { name: 'Chain Motor (1T)', quantity: stats.grid.numTowers || 4 }
                    ].filter(i => i.quantity > 0);

                    // Create Draft Project
                    projectService.create({
                        eventName: `Structure ${config.type} ${config.length}x${config.width}x${config.height}`,
                        status: 'Draft',
                        items: items
                    }).then(newProject => {
                        navigate('/projects');
                    });
                }}>
                    📦 {t('gen_packing')}
                </button>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button className="btn" style={{ flex: 1, background: '#374151', color: '#9ca3af', fontSize: '11px' }} onClick={() => {
                        if (captureRef.current) captureRef.current.capture(`Structure_${config.type}_3D.png`);
                    }}>
                        📸 {t('save_3d')}
                    </button>
                    <button className="btn" style={{ flex: 1, background: '#374151', color: '#9ca3af', fontSize: '11px' }} onClick={() => {
                        // Switch to 2D
                        setViewMode('2D');
                        // Wait for render
                        setTimeout(() => {
                            if (captureRef.current) captureRef.current.capture(`Structure_${config.type}_Plan.png`);
                        }, 600);
                    }}>
                        📐 {t('save_plan')}
                    </button>
                </div>
            </div>

            {/* Main Viewport (3D) */}
            <div className="calc-viewport" style={{ flex: 1, position: 'relative', background: '#ffffff' }}>
                <Suspense fallback={<div style={{ color: 'white', position: 'absolute', top: '50%', left: '50%' }}>Loading 3D Engine...</div>}>
                    <Canvas gl={{ preserveDrawingBuffer: true }}>
                        {viewMode === '3D' ? (
                            <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />
                        ) : (
                            <OrthographicCamera makeDefault position={[0, 20, 0]} zoom={40} near={-20} far={200} />
                        )}

                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} />

                        <Grid infiniteGrid fadeDistance={50} sectionColor="#4f4f4f" cellColor="#2f2f2f" />

                        <OrbitControls
                            makeDefault
                            enableRotate={viewMode === '3D'} // Lock rotation in 2D
                            enableZoom={true}
                        />
                        {/* Environment removed for offline stability */}
                        <color attach="background" args={['#ffffff']} />

                        <Truss3D
                            length={config.length}
                            width={config.width}
                            height={config.height}
                            sectionSize={stats.spec.sectionSize}
                            tubeSize={0.05}
                            isOverload={stats.isOverload}
                            grid={stats.grid}
                            towSpec={stats.towSpec}
                            gridSpecL={stats.gridSpecL}
                            gridSpecW={stats.gridSpecW}
                        />

                        {/* Capture Helper */}
                        <SceneCapture captureRef={captureRef} />
                    </Canvas>
                </Suspense>

                {/* Overlay Info */}
                <div className="equipment-overlay">
                    <div className="equipment-title">📋 CONFIGURATION HYBRIDE</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '8px' }}>
                        Tours: {stats.towSpec.name} | Gril: {stats.gridSpecL.name} {stats.gridSpecL.name !== stats.gridSpecW.name ? `& ${stats.gridSpecW.name}` : ''}
                    </div>
                    <div className="equipment-grid">
                        <div className="equipment-item"><span>3m Seg:</span> <span className="equipment-val">{stats.totals.s3}</span></div>
                        <div className="equipment-item"><span>2m Seg:</span> <span className="equipment-val">{stats.totals.s2}</span></div>
                        <div className="equipment-item"><span>1m Seg:</span> <span className="equipment-val">{stats.totals.s1}</span></div>
                        {stats.totals.s05 > 0 && (
                            <div className="equipment-item"><span>0.5m Seg:</span> <span className="equipment-val">{stats.totals.s05}</span></div>
                        )}
                        <div className="equipment-item"><span>Corners:</span> <span className="equipment-val">{stats.totals.corners}</span></div>
                        {stats.totals.tJunctions > 0 && (
                            <div className="equipment-item"><span>T-Junc:</span> <span className="equipment-val">{stats.totals.tJunctions}</span></div>
                        )}
                        {stats.totals.xJunctions > 0 && (
                            <div className="equipment-item"><span>4-Way:</span> <span className="equipment-val">{stats.totals.xJunctions}</span></div>
                        )}
                        <div className="equipment-item"><span>Base Plates:</span> <span className="equipment-val">{stats.totals.bases}</span></div>
                        <div className="equipment-item"><span>Hinges:</span> <span className="equipment-val">{stats.totals.hinges}</span></div>
                        <div className="equipment-item"><span>Motors:</span> <span className="equipment-val">{stats.grid.numTowers || 4}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StructureCalcView;

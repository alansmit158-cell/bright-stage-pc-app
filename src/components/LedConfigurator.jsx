import React, { useState, useEffect } from 'react';
import { Box, Settings, Cpu, Zap, Maximize, Save, Layers, Grid, Monitor, LayoutDashboard, Download, ArrowRight, Trash2, List, Camera, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import './TransferView.css';
import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

// Default P3.9 Spec
const DEFAULT_SPEC = {
    width: 500,
    height: 500,
    pixelPitch: 3.9,
    weight: 8.5,
    maxPower: 120
};

const LedConfigurator = () => {
    // State
    const [configType, setConfigType] = useState('L-Shape'); // Flat, L-Shape
    const [faceA, setFaceA] = useState({ cols: 6, rows: 4 });
    const [faceB, setFaceB] = useState({ cols: 4, rows: 4 }); // Return
    const [screenElements, setScreenElements] = useState([
        { id: 'screen-1', x: 0, y: 0, cols: 6, rows: 4, name: 'Main Screen' }
    ]);
    const [spec, setSpec] = useState(DEFAULT_SPEC);

    // Cabling State
    const [cablingMode, setCablingMode] = useState(false);
    const [viewMode, setViewMode] = useState('data'); // 'data' | 'power'
    const [activePort, setActivePort] = useState(1); // 1, 2, 3, 4
    const [signalPaths, setSignalPaths] = useState({ 1: [], 2: [], 3: [], 4: [] });
    const [powerPaths, setPowerPaths] = useState({ 1: [], 2: [], 3: [], 4: [] });
    const [zoom, setZoom] = useState(1.0);

    // Draggable Workspace State
    const [draggingId, setDraggingId] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Port Colors (Data)
    const portColors = {
        1: '#6cf9caff', // Green
        2: '#ff0000ff', // Blue
        3: '#f97316', // Orange
        4: '#a855f7'  // Purple
    };

    // Circuit Colors (Power)
    const powerColors = {
        1: '#082aeaff', // Yellow
        2: '#00f21cff', // Red
        3: '#00ffd0ff', // wlue (Power)
        4: '#da00b2ff'  // Grey/Neutral
    };

    // Calculated Stats
    const [stats, setStats] = useState(null);

    // Reset path on config change
    useEffect(() => {
        setSignalPaths({ 1: [], 2: [], 3: [], 4: [] });
        setPowerPaths({ 1: [], 2: [], 3: [], 4: [] });
    }, [faceA.cols, faceA.rows, faceB.cols, faceB.rows, configType, screenElements]);

    // Calc Hook
    useEffect(() => {
        calculateStats();
    }, [faceA, faceB, spec, configType, screenElements]);

    const calculateStats = async () => {
        try {
            const payload = {
                faceA,
                faceB: configType === 'Flat' ? { cols: 0, rows: 0 } : faceB,
                screenElements: configType === 'Complex' ? screenElements : [],
                configType,
                cabinetSpec: spec
            };

            const res = await axios.post(`${API_URL}/led-projects/calculate`, payload);
            setStats(res.data);
        } catch (err) {
            console.error("Calc Error", err);
        }
    };

    // Keyboard Navigation for Cabling
    useEffect(() => {
        if (!cablingMode) return;

        const handleKeyDown = (e) => {
            // Determine active set
            const activeSet = viewMode === 'data' ? signalPaths : powerPaths;
            const setFunction = viewMode === 'data' ? setSignalPaths : setPowerPaths;

            const currentPath = activeSet[activePort];
            if (currentPath.length === 0) return; // Need a start point

            const lastNode = currentPath[currentPath.length - 1];
            let { face, col, row } = lastNode;
            let nextFace = face;
            let nextCol = col;
            let nextRow = row;

            switch (e.key) {
                case 'ArrowUp':
                    nextRow -= 1;
                    break;
                case 'ArrowDown':
                    nextRow += 1;
                    break;
                case 'ArrowLeft':
                    nextCol -= 1;
                    break;
                case 'ArrowRight':
                    nextCol += 1;
                    break;
                case 'Backspace':
                case 'Delete':
                    setFunction(prev => ({ ...prev, [activePort]: prev[activePort].slice(0, -1) }));
                    return;
                default:
                    return; // Ignore other keys
            }

            // Boundary & Face Transition Logic
            if (nextFace === 'A') {
                if (nextRow < 1 || nextRow > faceA.rows) return;
                if (nextCol < 1) return;
                if (nextCol > faceA.cols) {
                    if (configType === 'L-Shape') {
                        nextFace = 'B';
                        nextCol = 1;
                    } else {
                        return;
                    }
                }
            } else if (nextFace === 'B') {
                if (nextRow < 1 || nextRow > faceA.rows) return;
                if (nextCol > faceB.cols) return;
                if (nextCol < 1) {
                    nextFace = 'A';
                    nextCol = faceA.cols;
                }
            }

            // Prevent Self-Collision (Don't allow moving back onto own path)
            if (currentPath.some(p => p.face === nextFace && p.col === nextCol && p.row === nextRow)) {
                return;
            }

            e.preventDefault();
            handleTileClick(nextFace, nextCol, nextRow);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cablingMode, activePort, signalPaths, powerPaths, viewMode, faceA, faceB, configType]);

    // Drag/Drop Handlers
    const handleMouseDown = (e, id) => {
        if (configType !== 'Complex' || cablingMode) return;
        setDraggingId(id);
        const el = screenElements.find(s => s.id === id);
        if (!el) return;
        setDragOffset({
            x: e.clientX - el.x,
            y: e.clientY - el.y
        });
    };

    const handleMouseMove = (e) => {
        if (!draggingId) return;
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Snap to grid (half a tile size for precision)
        const snap = 35 / 2; // pxPerTile / 2
        const snappedX = Math.round(newX / snap) * snap;
        const snappedY = Math.round(newY / snap) * snap;

        setScreenElements(prev => prev.map(el =>
            el.id === draggingId ? { ...el, x: snappedX, y: snappedY } : el
        ));
    };

    const handleMouseUp = () => {
        setDraggingId(null);
    };

    // Cabling Logic
    const handleTileClick = (face, col, row) => {
        if (!cablingMode) return;

        const id = `${face}-${col}-${row}`;

        // Determine active set based on viewMode
        const activeSet = viewMode === 'data' ? signalPaths : powerPaths;
        const setFunction = viewMode === 'data' ? setSignalPaths : setPowerPaths;

        // Check collision active port
        const currentPath = activeSet[activePort];
        const existingIndex = currentPath.findIndex(p => p.face === face && p.col === col && p.row === row);

        if (existingIndex !== -1) {
            // Undo logic for active port
            if (existingIndex === currentPath.length - 1) {
                setFunction(prev => ({ ...prev, [activePort]: prev[activePort].slice(0, -1) }));
            } else {
                setFunction(prev => ({ ...prev, [activePort]: prev[activePort].slice(0, existingIndex + 1) }));
            }
            return;
        }

        // Check collision other ports
        let isOccupied = false;
        Object.entries(activeSet).forEach(([port, path]) => {
            if (parseInt(port) !== activePort) {
                if (path.some(p => p.face === face && p.col === col && p.row === row)) {
                    isOccupied = true;
                }
            }
        });

        if (isOccupied) {
            const typeLabel = viewMode === 'data' ? 'Data Port' : 'Power Circuit';
            alert(`Tile already used in another ${typeLabel}!`);
            return;
        }

        // Phase 19: VALIDATION (Data Port Limit 10m²)
        if (viewMode === 'data') {
            const tileArea = (spec.width / 1000) * (spec.height / 1000); // m²
            const currentUsage = activeSet[activePort].length * tileArea;

            if ((currentUsage + tileArea) > 10) {
                alert(`⚠️ Port Limit Reached!\n\nThis port is utilizing ${currentUsage.toFixed(2)}m².\nAdding this tile would exceed the 10m² capacity limit.`);
                return;
            }
        }

        // Distance Check (for jumps between blocks)
        if (currentPath.length > 0) {
            const last = currentPath[currentPath.length - 1];
            const getPhy = (n) => {
                if (configType === 'Complex') {
                    const el = screenElements.find(s => s.id === n.face);
                    if (!el) return { x: 0, y: 0 };
                    return {
                        x: el.x_mm || (el.x * (spec.width / 35)), // Rough conversion if stored in px
                        y: el.y_mm || (el.y * (spec.height / 35))
                    };
                }
                const xBase = n.face === 'A' ? 0 : (faceA.cols * spec.width);
                return { x: xBase + (n.col - 1) * spec.width, y: (n.row - 1) * spec.height };
            };

            // Wait, el.x/y is in PX in the current UI (draggable). 
            // We should use tile coordinates for mapping.
            const p1 = getPhy(last);
            const p2 = getPhy({ face, col, row });
            const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) / 1000; // meters

            if (dist > 15) {
                const proceed = window.confirm(`⚠️ LONG CABLE ALERT: The jump to this cabinet is ${dist.toFixed(1)}m. Standard data cables are often shorter. Proceed?`);
                if (!proceed) return;
            }
        }

        // Add
        setFunction(prev => ({ ...prev, [activePort]: [...prev[activePort], { face, col, row, id }] }));
    };

    const generateSnake = (direction) => {
        let newPath = [];

        // Determine active set
        const activeSet = viewMode === 'data' ? signalPaths : powerPaths;
        const setFunction = viewMode === 'data' ? setSignalPaths : setPowerPaths;

        // Helper to add face points
        const traverseFace = (faceName, cols, rows) => {
            if (direction === 'horizontal') {
                for (let r = 1; r <= rows; r++) {
                    const isEven = r % 2 === 0;
                    for (let c = 1; c <= cols; c++) {
                        // ZigZag: Odd rows L->R, Even rows R->L
                        const actualCol = isEven ? (cols - c + 1) : c;

                        // Collision Check
                        let occupied = false;
                        Object.values(activeSet).forEach(path => {
                            if (path.some(p => p.face === faceName && p.col === actualCol && p.row === r)) occupied = true;
                        });

                        if (!occupied) {
                            newPath.push({ face: faceName, col: actualCol, row: r, id: `${faceName}-${actualCol}-${r}` });
                        }
                    }
                }
            } else { // vertical
                for (let c = 1; c <= cols; c++) {
                    const isEven = c % 2 === 0;
                    for (let r = 1; r <= rows; r++) {
                        // ZigZag: Odd cols T->B, Even cols B->T
                        const actualRow = isEven ? (rows - r + 1) : r;

                        // Collision Check
                        let occupied = false;
                        Object.values(activeSet).forEach(path => {
                            if (path.some(p => p.face === faceName && p.col === c && p.row === actualRow)) occupied = true;
                        });

                        if (!occupied) {
                            newPath.push({ face: faceName, col: c, row: actualRow, id: `${faceName}-${c}-${actualRow}` });
                        }
                    }
                }
            }
        };

        // Do Face A/B or Complex Blocks
        if (configType === 'Complex') {
            screenElements.forEach(el => {
                traverseFace(el.id, el.cols, el.rows);
            });
        } else {
            traverseFace('A', faceA.cols, faceA.rows);
            if (configType === 'L-Shape') {
                traverseFace('B', faceB.cols, faceA.rows);
            }
        }

        setFunction(prev => ({ ...prev, [activePort]: newPath }));
    };

    const handleClearPath = () => {
        const setFunction = viewMode === 'data' ? setSignalPaths : setPowerPaths;
        setFunction(prev => ({ ...prev, [activePort]: [] }));
    };

    // Render Canvas Helper
    const renderCanvas = (layerMode, isInteractive) => {
        const pathsToRender = layerMode === 'data' ? signalPaths : powerPaths;
        const colorsToRender = layerMode === 'data' ? portColors : powerColors;
        const pxPerTile = 35; // Moved here for clarity or defined in component

        return (
            <div
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    display: 'flex',
                    alignItems: 'start',
                    justifyContent: 'center',
                    gap: '2px',
                    position: 'relative',
                    minWidth: '1000px', // Large workspace
                    minHeight: '800px',
                    padding: '100px'
                }}>

                {/* SVG OVERLAY */}
                {cablingMode && (
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 20, pointerEvents: 'none', overflow: 'visible' }}>
                        <defs>
                            {Object.entries(portColors).map(([port, color]) => (
                                <marker key={`data-${port}`} id={`arrow-data-${port}`} markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                                    <path d="M0,0 L0,4 L4,2 z" fill={color} />
                                </marker>
                            ))}
                            {Object.entries(powerColors).map(([port, color]) => (
                                <marker key={`power-${port}`} id={`arrow-power-${port}`} markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                                    <path d="M0,0 L0,4 L4,2 z" fill={color} />
                                </marker>
                            ))}
                        </defs>

                        {/* Render Active Layer Only */}
                        {(() => {
                            const layer = viewMode;
                            const paths = layer === 'data' ? signalPaths : powerPaths;
                            const colors = layer === 'data' ? portColors : powerColors;
                            const width = layer === 'power' ? 3 : 2;

                            return Object.entries(paths).map(([port, path]) => {
                                const color = colors[port];
                                return (
                                    <g key={`${layer}-${port}`}>
                                        {path.map((node, i) => {
                                            if (i === 0) return null;
                                            const prev = path[i - 1];
                                            const getCoords = (n) => {
                                                if (configType === 'Complex') {
                                                    const el = screenElements.find(s => s.id === n.face); // In complex mode, face is the element ID
                                                    if (!el) return { x: 0, y: 0 };
                                                    return {
                                                        x: el.x + (n.col - 1) * pxPerTile + pxPerTile / 2,
                                                        y: el.y + (n.row - 1) * pxPerTile + pxPerTile / 2
                                                    };
                                                }
                                                const xBase = n.face === 'A' ? 0 : (faceA.cols * pxPerTile + 2);
                                                return {
                                                    x: xBase + (n.col - 1) * pxPerTile + pxPerTile / 2,
                                                    y: (n.row - 1) * pxPerTile + pxPerTile / 2
                                                };
                                            };
                                            const start = getCoords(prev);
                                            const end = getCoords(node);

                                            return (
                                                <line
                                                    key={`${layer}-${port}-${i}`}
                                                    x1={start.x} y1={start.y}
                                                    x2={end.x} y2={end.y}
                                                    stroke={color}
                                                    strokeWidth={width}
                                                    markerEnd={`url(#arrow-${layer}-${port})`}
                                                    strokeDasharray={layer === 'power' ? "5,2" : "none"}
                                                />
                                            );
                                        })}
                                    </g>
                                );
                            });
                        })()}
                    </svg>
                )}

                {/* COMPLEX ELEMENTS */}
                {configType === 'Complex' && screenElements.map(el => (
                    <div
                        key={el.id}
                        onMouseDown={(e) => handleMouseDown(e, el.id)}
                        style={{
                            position: 'absolute',
                            left: el.x,
                            top: el.y,
                            width: el.cols * pxPerTile,
                            height: el.rows * pxPerTile,
                            background: draggingId === el.id ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.1)',
                            border: `2px solid ${draggingId === el.id ? '#60a5fa' : '#3b82f6'}`,
                            display: 'grid',
                            gridTemplateColumns: `repeat(${el.cols}, 1fr)`,
                            gridTemplateRows: `repeat(${el.rows}, 1fr)`,
                            zIndex: draggingId === el.id ? 10 : 5,
                            cursor: cablingMode ? 'crosshair' : 'move'
                        }}
                    >
                        {Array.from({ length: el.rows }).map((_, r) => (
                            Array.from({ length: el.cols }).map((_, c) => {
                                const row = r + 1;
                                const col = c + 1;
                                let occupiedPort = null;
                                let pathIndex = -1;

                                Object.entries(pathsToRender).forEach(([port, path]) => {
                                    const idx = path.findIndex(p => p.face === el.id && p.col === col && p.row === row);
                                    if (idx !== -1) {
                                        occupiedPort = port;
                                        pathIndex = idx;
                                    }
                                });

                                return (
                                    <div
                                        key={`${el.id}-${col}-${row}`}
                                        onClick={() => isInteractive && handleTileClick(el.id, col, row)}
                                        style={{
                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: occupiedPort ? `${colorsToRender[occupiedPort]}33` : 'transparent',
                                            boxShadow: occupiedPort ? `inset 0 0 5px ${colorsToRender[occupiedPort]}` : 'none'
                                        }}
                                    >
                                        {occupiedPort && (
                                            <span style={{ fontSize: '10px', color: colorsToRender[occupiedPort], fontWeight: 'bold' }}>{pathIndex + 1}</span>
                                        )}
                                    </div>
                                );
                            })
                        ))}
                    </div>
                ))}

                {/* FACE A (Standard) */}
                {configType !== 'Complex' && (
                    <div style={{
                        width: faceA.cols * pxPerTile,
                        height: faceA.rows * pxPerTile,
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '2px solid #3b82f6',
                        position: 'relative',
                        display: 'grid',
                        gridTemplateColumns: `repeat(${faceA.cols}, 1fr)`,
                        gridTemplateRows: `repeat(${faceA.rows}, 1fr)`
                    }}>
                        {Array.from({ length: faceA.rows }).map((_, r) => (
                            Array.from({ length: faceA.cols }).map((_, c) => {
                                const row = r + 1;
                                const col = c + 1;
                                let occupiedPort = null;
                                let pathIndex = -1;

                                Object.entries(pathsToRender).forEach(([port, path]) => {
                                    const idx = path.findIndex(p => p.face === 'A' && p.col === col && p.row === row);
                                    if (idx !== -1) {
                                        occupiedPort = port;
                                        pathIndex = idx;
                                    }
                                });

                                return (
                                    <div
                                        key={`A-${col}-${row}`}
                                        onClick={() => isInteractive && handleTileClick('A', col, row)}
                                        style={{
                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                            cursor: (cablingMode && isInteractive) ? 'crosshair' : 'default',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            position: 'relative',
                                            background: occupiedPort ? `${colorsToRender[occupiedPort]}33` : 'transparent',
                                            transition: 'background 0.2s',
                                            boxShadow: occupiedPort ? `inset 0 0 5px ${colorsToRender[occupiedPort]}` : 'none'
                                        }}
                                    >
                                        {occupiedPort && (
                                            <span style={{ fontSize: '10px', color: colorsToRender[occupiedPort], fontWeight: 'bold' }}>{pathIndex + 1}</span>
                                        )}
                                    </div>
                                );
                            })
                        ))}
                    </div>
                )}

                {/* FACE B (Standard) */}
                {configType === 'L-Shape' && (
                    <div style={{
                        width: faceB.cols * pxPerTile,
                        height: faceA.rows * pxPerTile,
                        background: 'rgba(6, 182, 212, 0.1)',
                        border: '2px solid #06b6d4',
                        position: 'relative',
                        borderLeft: '4px dashed #06b6d4',
                        display: 'grid',
                        gridTemplateColumns: `repeat(${faceB.cols}, 1fr)`,
                        gridTemplateRows: `repeat(${faceA.rows}, 1fr)`
                    }}>
                        {Array.from({ length: faceA.rows }).map((_, r) => (
                            Array.from({ length: faceB.cols }).map((_, c) => {
                                const row = r + 1;
                                const col = c + 1;
                                let occupiedPort = null;
                                let pathIndex = -1;

                                Object.entries(pathsToRender).forEach(([port, path]) => {
                                    const idx = path.findIndex(p => p.face === 'B' && p.col === col && p.row === row);
                                    if (idx !== -1) {
                                        occupiedPort = port;
                                        pathIndex = idx;
                                    }
                                });

                                return (
                                    <div
                                        key={`B-${col}-${row}`}
                                        onClick={() => isInteractive && handleTileClick('B', col, row)}
                                        style={{
                                            border: '1px solid rgba(6, 182, 212, 0.3)',
                                            cursor: (cablingMode && isInteractive) ? 'crosshair' : 'default',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            position: 'relative',
                                            background: occupiedPort ? `${colorsToRender[occupiedPort]}33` : 'transparent',
                                            transition: 'background 0.2s',
                                            boxShadow: occupiedPort ? `inset 0 0 5px ${colorsToRender[occupiedPort]}` : 'none'
                                        }}
                                    >
                                        {occupiedPort && (
                                            <span style={{ fontSize: '10px', color: colorsToRender[occupiedPort], fontWeight: 'bold' }}>{pathIndex + 1}</span>
                                        )}
                                    </div>
                                );
                            })
                        ))}
                    </div>
                )}
                {!cablingMode && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#fff', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.8)', pointerEvents: 'none' }}>
                        FACE B<br />
                        <span style={{ fontSize: '0.8rem', fontWeight: 'normal', opacity: 0.8 }}>{stats?.resolution?.faceB_w}mm x {stats?.dimensions?.faceA_mm?.h}mm</span>
                    </div>
                )}
            </div>
        );
    };

    // Handlers
    const handleSave = async () => {
        const name = prompt("Enter Project Name:");
        if (!name) return;

        try {
            await axios.post(`${API_URL}/led-projects`, {
                projectName: name,
                configType,
                faceA,
                faceB: configType === 'Flat' ? { cols: 0, rows: 0 } : faceB,
                screenElements: configType === 'Complex' ? screenElements : [],
                cabinetSpec: spec,
                mounting: 'Flown'
            });
            alert("Project Saved!");
        } catch (e) { alert("Error saving"); }
    };

    // Collision Detection (Simple AABB)
    const checkCollisions = () => {
        if (configType !== 'Complex') return false;
        for (let i = 0; i < screenElements.length; i++) {
            for (let j = i + 1; j < screenElements.length; j++) {
                const a = screenElements[i];
                const b = screenElements[j];
                const aW = a.cols * 35; // using preview px for check
                const aH = a.rows * 35;
                const bW = b.cols * 35;
                const bH = b.rows * 35;

                if (a.x < b.x + bW && a.x + aW > b.x && a.y < b.y + bH && a.y + aH > b.y) {
                    return true;
                }
            }
        }
        return false;
    };

    const handleExportConfig = () => {
        if (!stats) return;

        if (checkCollisions()) {
            const proceed = window.confirm("⚠️ COLLISION DETECTED: Some screen blocks are overlapping. Exporting overlapping cabinets may cause NovaStar configuration errors. Proceed anyway?");
            if (!proceed) return;
        }

        // 1. Validation: 4K Limit
        const totalW = stats.resolution.totalW;
        const totalH = stats.resolution.totalH;

        if (totalW > 3840 || totalH > 2160) {
            alert(`⚠️ WARNING: Total Resolution (${totalW}x${totalH}) exceeds standard 4K Controller limit (3840x2160). Multiple controllers may be required.`);
        }

        // 2. Data Construction
        const exportData = {
            project: "Untitled Project",
            setup: configType === 'Complex' ? "Complex Screen" : (configType === 'L-Shape' ? "L-Shape 90°" : "Flat Wall"),
            timestamp: new Date().toISOString(),
            global_resolution: `${totalW}x${totalH}`,
            screen_elements: configType === 'Complex' ? screenElements : [],
            dimensions_mm: {
                width: stats.dimensions.totalWidth_mm,
                height: stats.dimensions.faceA_mm.h
            },
            faces: configType === 'Complex' ? screenElements.map(el => ({
                id: el.name || el.id,
                offset_x: el.x_mm || (el.x * (spec.width / 35)), // MM
                offset_y: el.y_mm || (el.y * (spec.height / 35)), // MM
                cols: el.cols,
                rows: el.rows,
                resolution: `${el.cols * Math.round(spec.width / spec.pixelPitch)}x${el.rows * Math.round(spec.height / spec.pixelPitch)}`
            })) : [
                {
                    id: "Face_A",
                    offset_x: 0,
                    offset_y: 0,
                    resolution: `${(faceA.cols * spec.width) / spec.pixelPitch}x${(faceA.rows * spec.height) / spec.pixelPitch}`
                }
            ],
            cabinet_map: configType === 'Complex' ? screenElements.flatMap(el => {
                const results = [];
                for (let r = 0; r < el.rows; r++) {
                    for (let c = 0; c < el.cols; c++) {
                        results.push({
                            parent: el.id,
                            col: c + 1,
                            row: r + 1,
                            x_origin: (el.x_mm || (el.x * (spec.width / 35))) + (c * spec.width),
                            y_origin: (el.y_mm || (el.y * (spec.height / 35))) + (r * spec.height)
                        });
                    }
                }
                return results;
            }) : [],
            hardware_estimation: {
                total_modules: (faceA.cols * faceA.rows) + (configType === 'L-Shape' ? (faceB.cols * faceA.rows) : 0),
                required_ports_eth: Math.ceil((totalW * totalH) / 650000),
                total_weight_kg: stats.hardware.totalWeightKg,
                total_power_w: stats.hardware.totalPowerW
            },
            cabling_routes: Object.entries(signalPaths).map(([port, path]) => ({
                port: parseInt(port),
                route: path.map((p, i) => ({ index: i + 1, ...p }))
            })).filter(p => p.route.length > 0),

            power_cabling_routes: Object.entries(powerPaths).map(([circuit, path]) => ({
                circuit: parseInt(circuit),
                route: path.map((p, i) => ({ index: i + 1, ...p }))
            })).filter(p => p.route.length > 0)
        };

        // Add Face B if L-Shape
        if (configType === 'L-Shape') {
            exportData.faces.push({
                id: "Face_B",
                offset_x: stats.resolution.faceA_w,
                offset_y: 0,
                resolution: `${(faceB.cols * 500) / spec.pixelPitch}x${(faceA.rows * 500) / spec.pixelPitch}`
            });
        }

        // 3. Blob Generation & Download
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `LED_Config_${configType}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportImage = async () => {
        const element = document.getElementById('preview-area');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#0B0E14',
                scale: 2, // Better resolution
            });

            const link = document.createElement('a');
            const modeName = viewMode.toUpperCase();
            link.download = `LED_${modeName}_Diagram_${configType}_${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error("Image Export Failed", err);
            alert("Failed to capture diagram. Please try again.");
        }
    };

    if (!stats) return <div style={{ padding: '2rem', color: 'white' }}>Initializing Configurator...</div>;

    // SCALING FOR PREVIEW
    const pxPerTile = 35; // Slightly smaller for better fit

    return (
        <div className="transfer-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: '0' }}>

            <div className="page-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers /> LED Configurator
            </div>

            <div className="transfer-grid" style={{ flex: 1, overflow: 'hidden', gap: '20px', marginBottom: '0' }}>

                {/* LEFT SIDEBAR - CONTROLS */}
                <div className="transfer-card" style={{ width: '300px', flex: 'none', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

                    <h3 className="card-title"><Settings size={18} style={{ display: 'inline', marginRight: '8px' }} /> Configuration</h3>

                    {/* CONFIGURATION TYPE */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label-text">Layout Mode</label>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                            <button
                                onClick={() => setConfigType('Flat')}
                                className={configType === 'Flat' ? 'btn-primary' : 'styled-input'}
                                style={{ flex: 1, padding: '8px', cursor: 'pointer', textAlign: 'center' }}
                            >
                                Flat Wall
                            </button>
                            <button
                                onClick={() => setConfigType('L-Shape')}
                                className={configType === 'L-Shape' ? 'btn-primary' : 'styled-input'}
                                style={{ flex: 1, padding: '8px', cursor: 'pointer', textAlign: 'center' }}
                            >
                                L-Shape
                            </button>
                            <button
                                onClick={() => setConfigType('Complex')}
                                className={configType === 'Complex' ? 'btn-primary' : 'styled-input'}
                                style={{ flex: 1, padding: '8px', cursor: 'pointer', textAlign: 'center' }}
                            >
                                Complex
                            </button>
                        </div>


                    </div>

                    {/* COMPLEX ELEMENTS CONTROLS */}
                    {configType === 'Complex' && (
                        <div style={{ marginBottom: '1.5rem', padding: '10px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <h4 style={{ color: '#3b82f6', margin: 0, fontSize: '1rem' }}>Screen Blocks</h4>
                                <button
                                    onClick={() => setScreenElements([...screenElements, {
                                        id: `screen-${Date.now()}`,
                                        x: 100, y: 100,
                                        cols: 2, rows: 2,
                                        name: `New Group ${screenElements.length + 1}`
                                    }])}
                                    style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                                >
                                    + Add Group
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {screenElements.map((el, index) => (
                                    <div key={el.id} style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>{el.name}</span>
                                            <button
                                                onClick={() => setScreenElements(screenElements.filter(s => s.id !== el.id))}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px' }}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Cols</label>
                                                <input
                                                    type="number"
                                                    value={el.cols}
                                                    onChange={(e) => {
                                                        const newEls = [...screenElements];
                                                        newEls[index].cols = Math.max(1, parseInt(e.target.value) || 0);
                                                        setScreenElements(newEls);
                                                    }}
                                                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: 'white', fontSize: '0.75rem', padding: '2px 4px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Rows</label>
                                                <input
                                                    type="number"
                                                    value={el.rows}
                                                    onChange={(e) => {
                                                        const newEls = [...screenElements];
                                                        newEls[index].rows = Math.max(1, parseInt(e.target.value) || 0);
                                                        setScreenElements(newEls);
                                                    }}
                                                    style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: 'white', fontSize: '0.75rem', padding: '2px 4px' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* FACE A CONTROLS (Hide if Complex) */}
                    {configType !== 'Complex' && (
                        <div style={{ marginBottom: '1.5rem', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                            <h4 style={{ color: '#3b82f6', margin: '0 0 10px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>Face A (Main)</span>
                                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{faceA.cols * 0.5}m x {faceA.rows * 0.5}m</span>
                            </h4>

                            <div style={{ marginBottom: '10px' }}>
                                <label className="label-text" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    Width (Cols) <span style={{ color: 'white' }}>{faceA.cols}</span>
                                </label>
                                <input
                                    type="range" min="1" max="30"
                                    value={faceA.cols}
                                    onChange={(e) => setFaceA({ ...faceA, cols: parseInt(e.target.value) })}
                                    style={{ width: '100%', accentColor: '#3b82f6' }}
                                />
                            </div>
                            <div>
                                <label className="label-text" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    Height (Rows) <span style={{ color: 'white' }}>{faceA.rows}</span>
                                </label>
                                <input
                                    type="range" min="1" max="20"
                                    value={faceA.rows}
                                    onChange={(e) => setFaceA({ ...faceA, rows: parseInt(e.target.value) })}
                                    style={{ width: '100%', accentColor: '#3b82f6' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* FACE B CONTROLS */}
                    {configType === 'L-Shape' && (
                        <div style={{ marginBottom: '1.5rem', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                            <h4 style={{ color: '#06b6d4', margin: '0 0 10px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>Face B (Return)</span>
                                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{faceB.cols * 0.5}m x {faceA.rows * 0.5}m</span>
                            </h4>

                            <div style={{ marginBottom: '10px' }}>
                                <label className="label-text" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    Width (Cols) <span style={{ color: 'white' }}>{faceB.cols}</span>
                                </label>
                                <input
                                    type="range" min="1" max="30"
                                    value={faceB.cols}
                                    onChange={(e) => setFaceB({ ...faceB, cols: parseInt(e.target.value) })}
                                    style={{ width: '100%', accentColor: '#06b6d4' }}
                                />
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                                Height locked to Face A ({faceA.rows} rows)
                            </div>
                        </div>
                    )}

                    {/* CABLING CONTROLS */}
                    <div style={{ marginBottom: '1.5rem', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <h4 style={{ color: viewMode === 'data' ? '#10b981' : '#eab308', margin: '0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {viewMode === 'data' ? <Zap size={16} /> : <Zap size={16} style={{ fill: '#eab308' }} />}
                                {viewMode === 'data' ? 'Data Cabling' : 'Power Cabling'}
                            </h4>
                            {/* TOGGLE */}
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', padding: '2px' }}>
                                <button
                                    onClick={() => setViewMode('data')}
                                    style={{
                                        padding: '4px 8px',
                                        background: viewMode === 'data' ? '#10b981' : 'transparent',
                                        color: 'white',
                                        fontSize: '0.7rem',
                                        border: 'none', borderRadius: '3px', cursor: 'pointer'
                                    }}
                                >DATA</button>
                                <button
                                    onClick={() => setViewMode('power')}
                                    disabled={true}
                                    style={{
                                        padding: '4px 8px',
                                        background: viewMode === 'power' ? '#eab308' : 'transparent',
                                        color: 'white',
                                        fontSize: '0.7rem',
                                        border: 'none', borderRadius: '3px',
                                        cursor: 'not-allowed',
                                        opacity: 0.3
                                    }}
                                    title="Power cabling is temporarily disabled"
                                >POWER</button>
                            </div>
                        </div>

                        {/* PORT / CIRCUIT SELECTOR */}
                        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                            {[1, 2, 3, 4].map(port => {
                                const colors = viewMode === 'data' ? portColors : powerColors;
                                const label = viewMode === 'data' ? `Port ${port}` : `Circuit ${port}`;

                                // Calc Usage
                                const currentPaths = viewMode === 'data' ? signalPaths : powerPaths;
                                const portPath = currentPaths[port] || [];
                                const tileArea = (spec.width / 1000) * (spec.height / 1000);
                                const usage = portPath.length * tileArea;
                                const usageText = viewMode === 'data' ? `${usage.toFixed(1)}m²` : `${portPath.length} tiles`;

                                return (
                                    <button
                                        key={port}
                                        onClick={() => setActivePort(port)}
                                        style={{
                                            flex: 1,
                                            padding: '5px',
                                            background: activePort === port ? colors[port] : 'transparent',
                                            border: `1px solid ${colors[port]}`,
                                            color: activePort === port ? 'white' : colors[port],
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                            borderRadius: '4px',
                                            transition: 'all 0.2s',
                                            opacity: cablingMode ? 1 : 0.6,
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
                                        }}
                                    >
                                        <span style={{ fontWeight: 'bold' }}>{label}</span>
                                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{usageText}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <button
                                onClick={() => setCablingMode(!cablingMode)}
                                className={cablingMode ? 'btn-primary' : 'styled-input'}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    fontSize: '0.8rem',
                                    background: cablingMode ? portColors[activePort] : 'transparent',
                                    borderColor: portColors[activePort],
                                    color: cablingMode ? 'white' : portColors[activePort]
                                }}
                            >
                                {cablingMode ? 'ACTIVE (Port ' + activePort + ')' : 'Enable Cabling'}
                            </button>
                        </div>

                        {cablingMode && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#ccc', marginBottom: '5px' }}>Auto-Presets ({Object.keys(signalPaths[activePort]).length > 0 ? 'Clear First' : 'For Active Port'}):</div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button onClick={() => generateSnake('horizontal')} className="styled-input" style={{ flex: 1, padding: '5px', fontSize: '0.75rem', textAlign: 'center', cursor: 'pointer' }}>
                                        <ArrowRight size={12} style={{ display: 'inline' }} /> Snake H
                                    </button>
                                    <button onClick={() => generateSnake('vertical')} className="styled-input" style={{ flex: 1, padding: '5px', fontSize: '0.75rem', textAlign: 'center', cursor: 'pointer' }}>
                                        <ArrowRight size={12} style={{ display: 'inline', transform: 'rotate(90deg)' }} /> Snake V
                                    </button>
                                </div>
                                <button onClick={handleClearPath} className="styled-input" style={{ padding: '5px', fontSize: '0.75rem', textAlign: 'center', cursor: 'pointer', marginTop: '5px', color: '#f87171', borderColor: '#f87171' }}>
                                    <Trash2 size={12} style={{ display: 'inline', marginRight: '5px' }} /> Clear Port {activePort}
                                </button>
                                <div style={{ marginTop: '5px', fontSize: '0.7rem', color: '#10b981' }}>
                                    Tiles: {signalPaths[activePort].length} | Total Used: {Object.values(signalPaths).flat().length}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                            onClick={handleExportConfig}
                            className="btn-secondary"
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', color: '#10b981', borderColor: '#10b981' }}
                        >
                            <Download size={18} /> Export Technical JSON
                        </button>

                        <button
                            onClick={handleSave}
                            className="btn-primary"
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Save size={18} /> Save Project
                        </button>
                    </div>

                </div>

                {/* MAIN PREVIEW AREA */}
                <div id="preview-area" className="transfer-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', position: 'relative' }}>

                    {/* Top Bar Overlay */}
                    <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ background: 'rgba(0,0,0,0.6)', padding: '5px 15px', borderRadius: '20px', fontSize: '0.85rem', color: viewMode === 'data' ? '#10b981' : '#eab308', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                                {viewMode.toUpperCase()} VIEW (ELEVATION)
                            </div>

                            {/* ZOOM CONTROLS */}
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.6)', borderRadius: '20px', padding: '2px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <button
                                    onClick={() => setZoom(prev => Math.max(0.2, prev - 0.1))}
                                    style={{ background: 'transparent', border: 'none', color: 'white', padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    title="Zoom Out"
                                >
                                    <ZoomOut size={14} />
                                </button>
                                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.7rem', color: '#ccc', padding: '0 5px', minWidth: '40px', justifyContent: 'center' }}>
                                    {Math.round(zoom * 100)}%
                                </div>
                                <button
                                    onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
                                    style={{ background: 'transparent', border: 'none', color: 'white', padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    title="Zoom In"
                                >
                                    <ZoomIn size={14} />
                                </button>
                                <button
                                    onClick={() => setZoom(1.0)}
                                    style={{ background: 'transparent', border: 'none', color: 'white', padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)' }}
                                    title="Reset Zoom"
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleExportImage}
                            data-html2canvas-ignore="true"
                            style={{
                                background: 'rgba(59, 130, 246, 0.2)',
                                padding: '8px 20px',
                                borderRadius: '20px',
                                border: '1px solid #3b82f6',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                backdropFilter: 'blur(4px)'
                            }}
                            title={`Download ${viewMode.toUpperCase()} Diagram`}
                        >
                            <Download size={16} /> Save {viewMode === 'data' ? 'Signal' : 'Power'} Diagram
                        </button>
                    </div>

                    {/* CANVAS CONTAINER */}
                    <div style={{ flex: 1, background: '#0B0E14', position: 'relative', display: 'flex', overflow: 'hidden' }}>

                        {/* Grid Background (Shared) */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                            opacity: 0.5,
                            zIndex: 0
                        }}></div>

                        {/* VIEWPORT AREA */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, overflow: 'auto' }}>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '40px',
                                padding: '60px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: `scale(${zoom})`,
                                transformOrigin: 'center center'
                            }}>
                                {/* Dynamic Mode Title for Export */}
                                <div style={{
                                    fontSize: '2.5rem',
                                    fontWeight: '900',
                                    color: viewMode === 'data' ? '#10b981' : '#eab308',
                                    marginBottom: '30px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '8px',
                                    opacity: 1,
                                    textShadow: '0 0 30px rgba(0,0,0,0.8)',
                                    borderBottom: `4px solid ${viewMode === 'data' ? '#10b981' : '#eab308'}`,
                                    paddingBottom: '10px',
                                    width: '100%',
                                    textAlign: 'center'
                                }}>
                                    {viewMode === 'data' ? 'SIGNAL CABLING DIAGRAM' : 'POWER CABLING DIAGRAM'}
                                </div>

                                <div
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        background: 'rgba(0,0,0,0.2)',
                                        padding: '20px', borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}
                                >
                                    {renderCanvas(viewMode, true)}
                                </div>

                                {/* Person Reference for Scale (1.8m approx) */}
                                <div style={{
                                    height: (1.8 / 0.5) * pxPerTile,
                                    width: '10px',
                                    background: '#475569', borderRadius: '4px',
                                    display: 'flex', alignItems: 'end', justifyContent: 'center',
                                    opacity: 0.8,
                                    position: 'relative',
                                    marginTop: '80px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                    alignSelf: 'flex-end'
                                }}>
                                    <span style={{ fontSize: '10px', color: '#ccc', marginBottom: '-20px', fontWeight: 'bold' }}>1.8m</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM HUD - STATS */}
                    <div style={{ height: '80px', background: '#1a1b26', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 20px' }}>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>{configType === 'Complex' ? 'Total Footprint' : 'Dimensions'}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>
                                {stats.dimensions.totalWidth_mm}mm <span style={{ color: '#64748b' }}>x</span> {stats.dimensions.totalHeight_mm || stats.dimensions.faceA_mm.h}mm
                            </div>
                        </div>

                        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }}></div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Resolution</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }}>
                                {stats.resolution.totalW} <span style={{ color: '#64748b' }}>x</span> {stats.resolution.totalH} px
                            </div>
                        </div>

                        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }}></div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Weight</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                {stats.hardware.totalWeightKg} kg
                            </div>
                        </div>

                        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }}></div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Power</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#eab308' }}>
                                {stats.hardware.totalPowerW} W
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default LedConfigurator;

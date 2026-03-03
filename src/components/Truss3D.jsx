import React, { useMemo } from 'react';
import { Box, Cylinder, Html } from '@react-three/drei';

/**
 * INDUSTRIAL 3D SPECS:
 * PT34: Section 290mm, Tube Center-to-Center 240mm.
 * FT44/HT44: Section 400mm, Tube Center-to-Center 350mm.
 * Material: Metalness 0.1, Roughness 0.5 (Matte for White Background).
 * Sleeve Block: Section + 50mm.
 */

const TrussSegment = ({ position, rotation, length, color, spacing, width, height, tubeSize = 0.05 }) => {
    // Support rectangular profiles (TT104) or default square (spacing)
    const w = width || spacing;
    const h = height || spacing;
    const halfW = w / 2;
    const halfH = h / 2;

    // Bracing: Zig-Zag pattern for realism
    const bracingInterval = 0.6; // approx spacing for diagonals
    const bracingCount = Math.floor(length / bracingInterval);
    const braces = [];
    const bThick = 0.02;

    for (let i = 0; i < bracingCount; i++) {
        const zMid = (i * bracingInterval) - (length / 2) + (bracingInterval / 2);

        // Add minimal bracing for visual "texture" without killing polygon count
        // Top/Bottom faces (Width-wise)
        braces.push(<Cylinder key={`b-top-${i}`} args={[bThick, bThick, w * 1.1, 4]} position={[0, halfH, zMid]} rotation={[0, 0, Math.PI / 2]}><meshStandardMaterial color={color} /></Cylinder>);
        braces.push(<Cylinder key={`b-bot-${i}`} args={[bThick, bThick, w * 1.1, 4]} position={[0, -halfH, zMid]} rotation={[0, 0, Math.PI / 2]}><meshStandardMaterial color={color} /></Cylinder>);

        // Side faces (Height-wise)
        braces.push(<Cylinder key={`b-left-${i}`} args={[bThick, bThick, h * 1.1, 4]} position={[-halfW, 0, zMid]} rotation={[0, 0, 0]}><meshStandardMaterial color={color} /></Cylinder>);
        braces.push(<Cylinder key={`b-right-${i}`} args={[bThick, bThick, h * 1.1, 4]} position={[halfW, 0, zMid]} rotation={[0, 0, 0]}><meshStandardMaterial color={color} /></Cylinder>);
    }

    return (
        <group position={position} rotation={rotation}>
            {/* 4 Main Chords (50mm tubes) */}
            {/* Positions relative to center: [+W/2, +H/2], [-W/2, +H/2], etc. */}
            <Cylinder args={[tubeSize / 2, tubeSize / 2, length, 8]} position={[halfW, halfH, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color={color} metalness={0.1} roughness={0.5} />
            </Cylinder>
            <Cylinder args={[tubeSize / 2, tubeSize / 2, length, 8]} position={[-halfW, halfH, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color={color} metalness={0.1} roughness={0.5} />
            </Cylinder>
            <Cylinder args={[tubeSize / 2, tubeSize / 2, length, 8]} position={[halfW, -halfH, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color={color} metalness={0.1} roughness={0.5} />
            </Cylinder>
            <Cylinder args={[tubeSize / 2, tubeSize / 2, length, 8]} position={[-halfW, -halfH, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color={color} metalness={0.1} roughness={0.5} />
            </Cylinder>
            {braces}
        </group>
    );
};

const SleeveBlock = ({ position, size, color }) => (
    <group position={position}>
        <Box args={[size, size, size]}>
            <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
        </Box>
        {/* Visual rollers/connectors */}
        <Box args={[size + 0.02, size - 0.1, size - 0.1]}>
            <meshStandardMaterial color="#111" wireframe />
        </Box>
    </group>
);

const TopSection = ({ position }) => (
    <group position={position}>
        <Box args={[0.5, 0.3, 0.5]} position={[0, 0.15, 0]}>
            <meshStandardMaterial color="#222" />
        </Box>
        <Cylinder args={[0.12, 0.12, 0.1, 16]} position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <meshStandardMaterial color="#b91c1c" />
        </Cylinder>
    </group>
);

const DimensionLabel = ({ position, label }) => (
    <group position={position}>
        <Html center style={{ pointerEvents: 'none' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#333', padding: '2px 6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', whiteSpace: 'nowrap', fontFamily: 'monospace', fontWeight: 'bold' }}>
                {label}
            </div>
        </Html>
    </group>
);


const Truss3D = ({ length, width, height, sectionSize = 0.29, tubeSize = 0.05, isOverload = false, grid = {}, towSpec = {}, gridSpecL = {}, gridSpecW = {} }) => {
    // 1. STRICT GEOMETRIC PARAMETERS (Hybrid Support)
    // Tower Dimensions
    const towerWidth = towSpec.sectionWidth || sectionSize;
    const towerHeightDim = towSpec.sectionHeight || sectionSize; // Usually square

    // Grid Dims per Axis
    const gridWL = gridSpecL.sectionWidth || sectionSize;
    const gridHL = gridSpecL.sectionHeight || sectionSize;
    const gridWW = gridSpecW.sectionWidth || sectionSize;
    const gridHW = gridSpecW.sectionHeight || sectionSize;

    // Tube Spacing (Center-to-Center) - Visual approx
    let tubeSpacing = 0.24;
    if (Math.max(towerWidth, gridWL, gridWW) >= 0.35) tubeSpacing = 0.35;

    // Sleeve Block Size = Max Section of connected parts + 5cm
    const sleeveSize = Math.max(towerWidth, towerHeightDim, gridWL, gridHL, gridWW, gridHW) + 0.05;

    // Colors
    const defaultColor = '#555555';
    // Towers usually default unless overloaded (Global overload affects all?)
    const towerColor = isOverload ? '#ef4444' : defaultColor;

    // Beam Colors (Per Axis)
    const beamColorL = grid.spanColorL || defaultColor;
    const beamColorW = grid.spanColorW || defaultColor;

    // Dimensions
    const towerTopHeight = height + 1.0; // Tower actual height

    // Generate Towers (Corners vs Goalpost)
    const towers = [];
    const sleeves = [];

    // Grid Positions
    // Generate Grid Points (Multi-Span Support)
    const parseSpans = (input) => {
        const str = String(input).replace(/,/g, ' ').trim();
        const parts = str.split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0);
        return parts.length > 0 ? parts : [parseFloat(input) || 0];
    };

    const generateGridPoints = (spans) => {
        let current = 0;
        const points = [0];
        spans.forEach(val => {
            current += val;
            points.push(current);
        });
        // Center the grid around 0,0
        const total = points[points.length - 1];
        const offset = total / 2;
        return points.map(p => p - offset);
    };

    const lenSpans = grid.lenSpans || parseSpans(length);
    const widSpans = grid.widSpans || parseSpans(width);

    // X-Axis points (Along Width)
    const xPos = grid.isGoalpost ? [0] : generateGridPoints(widSpans);

    // Z-Axis points (Along Length)
    const zPos = generateGridPoints(lenSpans);

    // Towers at all intersections
    let towerCoords = [];

    if (grid.isGoalpost) {
        // Goalpost: Towers at ends of Length (Z-axis), centered on Width (X=0)
        // Only First and Last Z points
        if (zPos.length >= 2) {
            const zStart = zPos[0];
            const zEnd = zPos[zPos.length - 1];
            towerCoords = [[0, zStart], [0, zEnd]];
        }
    } else {
        // Grid: All X * All Z
        xPos.forEach(x => {
            zPos.forEach(z => {
                towerCoords.push([x, z]);
            });
        });
    }

    towerCoords.forEach(([x, z]) => {
        towers.push(
            <group key={`t-${x}-${z}`} position={[x, towerTopHeight / 2, z]}>
                <TrussSegment
                    length={towerTopHeight}
                    width={towerWidth}
                    height={towerHeightDim}
                    spacing={tubeSpacing}
                    color={towerColor}
                    rotation={[Math.PI / 2, 0, 0]}
                />
                <TopSection position={[0, towerTopHeight / 2, 0]} />
                <Cylinder args={[0.005, 0.005, height, 4]} position={[0, 0, 0]}><meshStandardMaterial color="#111" /></Cylinder>
                <Box args={[0.6, 0.05, 0.6]} position={[0, -towerTopHeight / 2, 0]}><meshStandardMaterial color="#000" /></Box>

                {/* Outriggers for Goalpost - Should match tower spec or smaller? Usually smaller (290) */}
                {grid.isGoalpost && (
                    <group position={[0, -towerTopHeight / 2 + 0.1, 0]}>
                        {/* Front Leg */}
                        <TrussSegment position={[1, 0, 0]} length={2} width={towerWidth} height={towerHeightDim} spacing={tubeSpacing} color={towerColor} rotation={[0, 0, Math.PI / 2]} />
                        {/* Back Leg */}
                        <TrussSegment position={[-1, 0, 0]} length={2} width={towerWidth} height={towerHeightDim} spacing={tubeSpacing} color={towerColor} rotation={[0, 0, Math.PI / 2]} />
                    </group>
                )}
            </group>
        );
    });

    // Generate Sleeves (At ALL Grid Points)
    // For Goalpost, sleeves only at towers? Or maybe none needed if top mount?
    // Let's keep sleeves at tower positions for visual consistency.
    // Generate Sleeves (At ALL Grid Points for safe connectivity visualization)
    if (!grid.isGoalpost) {
        xPos.forEach(x => {
            zPos.forEach(z => {
                sleeves.push(<SleeveBlock key={`s-${x}-${z}`} position={[x, height, z]} size={sleeveSize} />);
            });
        });
    } else {
        // Goalpost Sleeves
        sleeves.push(<SleeveBlock key="s-g-1" position={[0, height, length / 2]} size={sleeveSize} />);
        sleeves.push(<SleeveBlock key="s-g-2" position={[0, height, -length / 2]} size={sleeveSize} />);
    }

    const beams = [];

    if (grid.isGoalpost) {
        // GOALPOST BEAM (Single Span along Z at X=0)
        if (lenSpans.length > 1) { // If split logic used for goalpost (unlikely but possible)
            // ... handle split goalpost ...
            // For now standard goalpost assumes no split or just 1 split
        }

        // Simplified Goalpost Beam
        // Just one beam seg? Or two if split?
        // Let's use loop logic to be safe if goalpost spans > 12m
        for (let i = 0; i < zPos.length - 1; i++) {
            const z1 = zPos[i];
            const z2 = zPos[i + 1];
            const midZ = (z1 + z2) / 2;
            const segLen = Math.abs(z2 - z1) - sleeveSize;
            beams.push(
                <TrussSegment
                    key={`bg-${i}`}
                    position={[0, height, midZ]}
                    length={segLen}
                    width={gridWL}
                    height={gridHL}
                    spacing={tubeSpacing}
                    color={beamColorL} // Goalpost beam is Length-wise
                    rotation={[0, 0, 0]}
                />
            );
        }

        // Screen Placeholder (Goalpost only)
        beams.push(
            <group key="screen" position={[0, height / 2 + 1, 0]}>
                <Box args={[0.1, height - 2, length - 1]} position={[0, 0, 0]}>
                    <meshStandardMaterial color="#000000" emissive="#111111" />
                </Box>
                {/* Screen "Image" */}
                <Box args={[0.11, height - 2.2, length - 1.2]} position={[0, 0, 0]}>
                    <meshStandardMaterial color="#0044aa" emissive="#002255" />
                </Box>
            </group>
        );

    } else {
        // GRID LOGIC (Multi-Span Beam Generation)
        // Beams along Z (Length) at every xPos
        xPos.forEach(x => {
            for (let i = 0; i < zPos.length - 1; i++) {
                const z1 = zPos[i];
                const z2 = zPos[i + 1];
                const midZ = (z1 + z2) / 2;
                const segLen = Math.abs(z2 - z1) - sleeveSize;

                beams.push(
                    <TrussSegment
                        key={`bz-${x}-${i}`}
                        position={[x, height, midZ]}
                        length={segLen}
                        width={gridWL}
                        height={gridHL}
                        spacing={tubeSpacing}
                        color={beamColorL}
                        rotation={[0, 0, 0]}
                    />
                );
            }
        });

        // Beams along X (Width) at every zPos
        zPos.forEach(z => {
            for (let i = 0; i < xPos.length - 1; i++) {
                const x1 = xPos[i];
                const x2 = xPos[i + 1];
                const midX = (x1 + x2) / 2;
                const segLen = Math.abs(x2 - x1) - sleeveSize;

                beams.push(
                    <TrussSegment
                        key={`bx-${z}-${i}`}
                        position={[midX, height, z]}
                        length={segLen}
                        width={gridWW}
                        height={gridHW}
                        spacing={tubeSpacing}
                        color={beamColorW}
                        rotation={[0, Math.PI / 2, 0]}
                    />
                );
            }
        });
    }

    return (
        <group>
            {towers}
            {sleeves}
            {beams}

            {/* --- 4. EXTRAS & LABELS --- */}
            {/* Floor */}
            <gridHelper args={[Math.max(length, width) + 10, 20, 0x888888, 0xbbbbbb]} />


            {/* DIMENSION LABELS (Html Annotations) */}
            {/* Length Label (along Z) */}
            <DimensionLabel position={[-width / 2 - 1, height / 2, 0]} label={`Length: ${length}m`} />
            {/* Width Label (along X) */}
            <DimensionLabel position={[0, height + 1, length / 2]} label={`Width: ${width}m`} />
            {/* Height Label */}
            <DimensionLabel position={[width / 2 + 1, height / 2, length / 2]} label={`Height: ${height}m`} />

        </group>
    );
};

export default Truss3D;

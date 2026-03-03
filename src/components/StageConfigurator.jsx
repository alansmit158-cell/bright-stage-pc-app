import React, { useState } from 'react';
import { Layers, Grid, Plus, Calculator } from 'lucide-react';
import './TransferView.css'; // Re-using existing dark theme styles

const StageConfigurator = () => {
    // 1. Dimensions (Modules)
    const [length, setLength] = useState(6); // L
    const [width, setWidth] = useState(4);   // W

    const [results, setResults] = useState(null);

    // 2. Calculation Logic
    const handleCalculate = () => {
        const L = parseInt(length) || 0;
        const W = parseInt(width) || 0;

        // Praticables: L * W
        const decks = L * W;

        // Pieds: (L + 1) * (W + 1)
        const legs = (L + 1) * (W + 1);

        // Côtés: (L * (W + 1)) + (W * (L + 1))
        // Note: The user specified this formula. Physically this counts all internal edges too.
        const sides = (L * (W + 1)) + (W * (L + 1));

        setResults([
            { name: "Praticable de Scène 1.22x1.22m", qty: decks },
            { name: "Pied de Scène", qty: legs },
            { name: "Côté de Scène", qty: sides }
        ]);
    };

    // 3. Simulation of "Add to List"
    const handleAddToList = () => {
        alert("Items added to project list simulation:\n\n" + results.map(r => `- ${r.qty}x ${r.name}`).join('\n'));
    };

    return (
        <div className="transfer-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', color: 'white' }}>

            {/* Header */}
            <div className="page-title" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={24} /> Calculateur de Scène
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '30px', flex: 1 }}>

                {/* Control Panel */}
                <div className="transfer-card" style={{ height: 'fit-content' }}>
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Grid size={18} /> Dimensions
                    </h3>

                    <div style={{ marginBottom: '15px' }}>
                        <label className="label-text">Longueur (L) - en modules</label>
                        <input
                            type="number"
                            className="styled-input"
                            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                            value={length}
                            onChange={(e) => setLength(e.target.value)}
                            min="1"
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label className="label-text">Largeur (W) - en modules</label>
                        <input
                            type="number"
                            className="styled-input"
                            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                            value={width}
                            onChange={(e) => setWidth(e.target.value)}
                            min="1"
                        />
                    </div>

                    <button
                        onClick={handleCalculate}
                        className="btn-primary"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                        <Calculator size={18} /> Calculer
                    </button>
                </div>

                {/* Results Panel */}
                <div className="transfer-card" style={{ height: 'fit-content' }}>
                    <h3 className="card-title">Résultats</h3>

                    {!results ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                            Entrez les dimensions et cliquez sur "Calculer"
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                                {/* Simple Visual Representation of the Grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${length}, 1fr)`,
                                    gap: '2px',
                                    maxWidth: '100%',
                                    width: 'fit-content',
                                    border: '2px solid #3b82f6',
                                    padding: '2px',
                                    background: '#0f172a'
                                }}>
                                    {Array.from({ length: length * width }).map((_, i) => (
                                        <div key={i} style={{ width: '30px', height: '30px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)' }}></div>
                                    ))}
                                </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                        <th style={{ padding: '10px' }}>Élément</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Quantité</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '15px 10px', fontWeight: 'bold' }}>{item.name}</td>
                                            <td style={{ padding: '15px 10px', textAlign: 'right', color: '#60a5fa', fontSize: '1.2rem', fontWeight: 'bold' }}>{item.qty}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <button
                                onClick={handleAddToList}
                                className="btn"
                                style={{ width: '100%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                            >
                                <Plus size={18} /> Ajouter à la liste
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StageConfigurator;

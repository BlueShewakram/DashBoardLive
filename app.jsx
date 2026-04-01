const { useState, useEffect, useRef } = React;

const SHEETDB_API_URL = 'https://sheetdb.io/api/v1/l6bnakhi1hpn9';

const getVal = (row, keyword) => {
    const key = Object.keys(row).find(k => k.toLowerCase().includes(keyword.toLowerCase()));
    return key ? row[key] : "N/A";
};

const App = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(true);

    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }, [isDarkMode]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(SHEETDB_API_URL);
            if (!response.ok) throw new Error('Network response was not ok');
            const result = await response.json();
            
            if (result.error) throw new Error(result.error);
            setData(result);
        } catch (err) {
            console.error(err);
            setError("Could not connect to SheetDB. Please verify your connection or API ID.");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalRespondents = data.length;

    let validC3Scores = 0;
    let sumC3Scores = 0;
    data.forEach(row => {
        const val = parseInt(getVal(row, "C3."));
        if (!isNaN(val)) {
            sumC3Scores += val;
            validC3Scores++;
        }
    });
    const avgDataImportance = validC3Scores > 0 ? (sumC3Scores / validC3Scores).toFixed(1) : "0.0";

    let aiComfortableCount = 0;
    data.forEach(row => {
        const val = String(getVal(row, "D1.")).toLowerCase();
        if (val.includes("comfortable") && !val.includes("uncomfortable")) {
            aiComfortableCount++;
        }
    });
    const aiAcceptanceRate = totalRespondents > 0 ? ((aiComfortableCount / totalRespondents) * 100).toFixed(0) : "0";

    const domainCounts = {};
    data.forEach(row => {
        const domain = getVal(row, "A4.");
        if (domain && domain !== "N/A") {
            domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        }
    });
    let topDomain = "N/A";
    let maxDomainCount = 0;
    for (const [domain, count] of Object.entries(domainCounts)) {
        if (count > maxDomainCount) {
            maxDomainCount = count;
            topDomain = domain;
        }
    }

    const ageDistribution = {};
    data.forEach(row => {
        const age = getVal(row, "A2.");
        if (age && age !== "N/A") {
            ageDistribution[age] = (ageDistribution[age] || 0) + 1;
        }
    });

    const statusDistribution = {};
    data.forEach(row => {
        const status = getVal(row, "A3.");
        if (status && status !== "N/A") {
            statusDistribution[status] = (statusDistribution[status] || 0) + 1;
        }
    });

    const AgeDistributionChart = ({ chartData }) => {
        const chartRef = useRef(null);
        const [chartInstance, setChartInstance] = useState(null);

        useEffect(() => {
            if (chartRef.current && Object.keys(chartData).length > 0) {
                if (chartInstance) chartInstance.destroy();

                const ctx = chartRef.current.getContext('2d');
                const labels = Object.keys(chartData).sort();
                const values = labels.map(label => chartData[label]);

                const gradientFill = ctx.createLinearGradient(0, 0, 0, 300);
                gradientFill.addColorStop(0, '#10b981');
                gradientFill.addColorStop(1, '#84cc16');

                const newChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Respondents',
                            data: values,
                            backgroundColor: gradientFill,
                            borderRadius: 6,
                            barThickness: 32
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(2, 44, 34, 0.95)',
                                titleColor: '#fff',
                                bodyColor: '#a7f3d0',
                                titleFont: { family: 'Outfit', size: 14, weight: 600 },
                                bodyFont: { family: 'Outfit', size: 13 },
                                cornerRadius: 10,
                                displayColors: false,
                                padding: 12
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false },
                                ticks: { color: isDarkMode ? '#a7f3d0' : '#047857', font: { family: 'Outfit' }, stepSize: 1 }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { color: isDarkMode ? '#a7f3d0' : '#047857', font: { family: 'Outfit' } }
                            }
                        }
                    }
                });
                setChartInstance(newChart);
            }
            return () => { if (chartInstance) chartInstance.destroy(); };
        }, [chartData, isDarkMode]);

        return <div className="chart-container-large"><canvas ref={chartRef}></canvas></div>;
    };

    const StatusDoughnutChart = ({ chartData }) => {
        const chartRef = useRef(null);
        const [chartInstance, setChartInstance] = useState(null);

        useEffect(() => {
            if (chartRef.current && Object.keys(chartData).length > 0) {
                if (chartInstance) chartInstance.destroy();

                const ctx = chartRef.current.getContext('2d');
                const labels = Object.keys(chartData);
                const values = Object.values(chartData);

                const newChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: values,
                            backgroundColor: [
                                '#10b981',
                                '#34d399',
                                '#fbbf24',
                                '#6ee7b7',
                                '#84cc16'
                            ],
                            borderWidth: 0,
                            hoverOffset: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '75%',
                        plugins: {
                            legend: { 
                                position: 'right',
                                labels: { color: isDarkMode ? '#a7f3d0' : '#047857', font: { family: 'Outfit', size: 13 }, padding: 20 }
                            }
                        }
                    }
                });
                setChartInstance(newChart);
            }
            return () => { if (chartInstance) chartInstance.destroy(); };
        }, [chartData, isDarkMode]);

        return <div className="chart-container-medium"><canvas ref={chartRef}></canvas></div>;
    };

    if (loading) {
        return (
            <div className="loading-wrapper">
                <div className="spinner"></div>
                <p>Syncing Research Data from SheetDB...</p>
            </div>
        );
    }

    return (
        <div className="layout-wrapper">
            <main className="main-content">
                <header className="header">
                    <div className="header-title-group">
                        <h1>Career Research Sandbox</h1>
                        <p>Live analysis of the Career Guidance System Survey.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button className="btn-secondary" onClick={toggleTheme} title="Toggle Dark/Light Mode">
                            {isDarkMode ? <i className="ph ph-sun"></i> : <i className="ph ph-moon"></i>}
                        </button>
                        <button className="btn-primary" onClick={fetchData}>
                            <i className="ph ph-arrows-clockwise" style={{ fontSize: '1.25rem' }}></i>
                            Refresh Metrics
                        </button>
                    </div>
                </header>

                {error && (
                    <div style={{ padding: '20px 24px', background: 'rgba(239, 68, 68, 0.08)', color: '#fca5a5', borderRadius: '16px', marginBottom: '32px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <i className="ph ph-warning-circle" style={{ fontSize: '1.75rem' }}></i>
                        <div style={{fontSize: '1.05rem', fontWeight: 600}}>{error}</div>
                    </div>
                )}

                <section className="dashboard-section">
                    <h2 className="section-header">
                        <i className="ph ph-leaf section-icon"></i>
                        Primary KPI Metrics
                    </h2>
                    <div className="bento-grid">
                        
                        <div className="bento-card col-span-3">
                            <div className="kpi-header">
                                <h3 className="card-title">Total Responses</h3>
                                <div className="card-icon emerald-icon"><i className="ph ph-users-three"></i></div>
                            </div>
                            <div className="card-value">{totalRespondents}</div>
                            <div className="card-subtitle">
                                <i className="ph ph-check-circle"></i>
                                <span>Global sync fully stable</span>
                            </div>
                        </div>

                        <div className="bento-card col-span-3">
                            <div className="kpi-header">
                                <h3 className="card-title">AI Acceptance</h3>
                                <div className="card-icon mint-icon"><i className="ph ph-robot"></i></div>
                            </div>
                            <div className="card-value">{aiAcceptanceRate}%</div>
                            <div className="card-subtitle">
                                <i className="ph ph-brain"></i>
                                <span>Comfortable with AI</span>
                            </div>
                        </div>

                        <div className="bento-card col-span-3">
                            <div className="kpi-header">
                                <h3 className="card-title">Data Importance</h3>
                                <div className="card-icon lime-icon"><i className="ph ph-chart-line-up"></i></div>
                            </div>
                            <div className="card-value">{avgDataImportance} <span style={{fontSize: '1.25rem', color:'var(--text-muted)', fontWeight: 500}}>/ 5</span></div>
                            <div className="card-subtitle">
                                <i className="ph ph-star"></i>
                                <span>Average target valuation</span>
                            </div>
                        </div>

                        <div className="bento-card col-span-3">
                            <div className="kpi-header">
                                <h3 className="card-title">Top Domain</h3>
                                <div className="card-icon gold-icon"><i className="ph ph-briefcase"></i></div>
                            </div>
                            <div className="card-value" style={{fontSize: '1.8rem'}}>{topDomain.split('/')[0]}</div>
                            <div className="card-subtitle">
                                <i className="ph ph-globe-hemisphere-west"></i>
                                <span>Predominant career field</span>
                            </div>
                        </div>

                    </div>
                </section>

                <section className="dashboard-section">
                    <h2 className="section-header" style={{marginTop: '48px'}}>
                        <i className="ph ph-chart-pie-slice section-icon"></i>
                        Demographic Insights
                    </h2>
                    <div className="bento-grid">
                        <div className="bento-card col-span-8">
                            <h3 className="card-title">Age Segment Distribution</h3>
                            <AgeDistributionChart chartData={ageDistribution} />
                        </div>

                        <div className="bento-card col-span-4">
                            <h3 className="card-title">Candidate Educational Focus</h3>
                            <StatusDoughnutChart chartData={statusDistribution} />
                        </div>
                    </div>
                </section>

                <section className="dashboard-section">
                    <h2 className="section-header" style={{marginTop: '48px'}}>
                        <i className="ph ph-table section-icon"></i>
                        Live Database Feed
                    </h2>
                    <div className="bento-card col-span-12" style={{padding: '32px 40px'}}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h3 className="card-value" style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Global Survey Tracking</h3>
                                <p style={{color: 'var(--text-muted)', fontSize: '0.95rem'}}>Continuous stream via secure SheetDB uplink.</p>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 16px', borderRadius: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulse 2s infinite'}}></div>
                                Live Sync
                            </div>
                        </div>

                        <div className="data-table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '8%' }}>ID</th>
                                        <th style={{ width: '15%' }}>Alias Category</th>
                                        <th style={{ width: '15%' }}>Sector Field</th>
                                        <th style={{ width: '25%' }}>Method of Approach</th>
                                        <th style={{ width: '37%' }}>Primary Obstacle / Challenge</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.slice(-8).reverse().map((row, idx) => {
                                        const respondent = getVal(row, "Respondents");
                                        const status = getVal(row, "A3.");
                                        const domain = getVal(row, "A4.");
                                        const explore = getVal(row, "B1.");
                                        const challenge = getVal(row, "13.");
                                        
                                        const isStudent = status.toLowerCase().includes('student');
                                        const isEmployed = status.toLowerCase().includes('employ');
                                        
                                        return (
                                        <tr key={idx}>
                                            <td style={{ color: 'var(--text-main)', fontWeight: 700 }}>{respondent}</td>
                                            <td>
                                                <span className={`status-badge ${isStudent ? 'status-primary' : (isEmployed ? 'status-success' : 'status-warning')}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-main)', fontWeight: 500 }}>{domain}</td>
                                            <td style={{ color: 'var(--text-muted)' }}>{explore.length > 35 ? explore.substring(0, 35) + '...' : explore}</td>
                                            <td style={{ color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                "{challenge}"
                                            </td>
                                        </tr>
                                        );
                                    })}
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>
                                                <i className="ph ph-folder-open" style={{ fontSize: '2.5rem', marginBottom: '16px', opacity: 0.3 }}></i><br />
                                                No active telemetry found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

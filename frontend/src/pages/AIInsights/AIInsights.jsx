import { useState, useEffect } from "react";
import axios from "axios";
import "./AIInsights.css";

function AIInsights() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    insights: [],
    predictions: [],
    recommendations: [],
    stats: { total: 0, high: 0, medium: 0, low: 0 }
  });
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("insights");

  const API_URL = 'http://localhost:5001/api';

  useEffect(() => {
    fetchAIData();
  }, []);

  const fetchAIData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/ai/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('AI Dashboard Data:', response.data);
      setDashboardData(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch AI data:', error);
      setError('Failed to load AI insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/ai/insights/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Generate Insights Response:', response.data);
      
      if (response.data.message) {
        alert('✅ ' + response.data.message);
      }
      
      // Refresh data after generation
      await fetchAIData();
      
      if (response.data.insights && response.data.insights.length === 0) {
        alert('No insights were generated. Make sure you have enough data (orders, inventory, etc.)');
      }
    } catch (error) {
      console.error('Failed to generate insights:', error);
      alert('❌ Failed to generate insights. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const dismissInsight = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/ai/insights/${id}/dismiss`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchAIData();
    } catch (error) {
      console.error('Failed to dismiss insight:', error);
    }
  };

  const updateRecommendation = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/ai/recommendations/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchAIData();
    } catch (error) {
      console.error('Failed to update recommendation:', error);
    }
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: { class: 'priority-high', label: '🔴 High' },
      medium: { class: 'priority-medium', label: '🟡 Medium' },
      low: { class: 'priority-low', label: '🟢 Low' }
    };
    return badges[priority] || badges.low;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { class: 'status-pending', label: '⏳ Pending' },
      'in-progress': { class: 'status-progress', label: '🔄 In Progress' },
      'completed': { class: 'status-completed', label: '✅ Completed' },
      'dismissed': { class: 'status-dismissed', label: '❌ Dismissed' }
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="ai-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading AI insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-page">
        <div className="error-container">
          <p>❌ {error}</p>
          <button onClick={fetchAIData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-page">
      {/* Header */}
      <div className="ai-header">
        <div className="header-left">
          <h1 className="page-title">🤖 AI Insights</h1>
          <p className="page-subtitle">Intelligent business insights, predictions, and recommendations</p>
        </div>
        <button 
          className="generate-btn" 
          onClick={generateInsights}
          disabled={generating}
        >
          {generating ? '⏳ Generating...' : '🔄 Generate Insights'}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="ai-stats">
        <div className="stat-card">
          <div className="stat-icon">💡</div>
          <div className="stat-info">
            <h3>{dashboardData.stats.total || 0}</h3>
            <p>Total Insights</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-info">
            <h3>{dashboardData.stats.high || 0}</h3>
            <p>High Priority</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟡</div>
          <div className="stat-info">
            <h3>{dashboardData.stats.medium || 0}</h3>
            <p>Medium Priority</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <h3>{dashboardData.stats.low || 0}</h3>
            <p>Low Priority</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="ai-tabs">
        <button 
          className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          💡 Insights ({dashboardData.insights?.length || 0})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'predictions' ? 'active' : ''}`}
          onClick={() => setActiveTab('predictions')}
        >
          🔮 Predictions ({dashboardData.predictions?.length || 0})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          📋 Recommendations ({dashboardData.recommendations?.length || 0})
        </button>
      </div>

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="insights-list">
          {dashboardData.insights && dashboardData.insights.length > 0 ? (
            dashboardData.insights.map((insight) => (
              <div key={insight.id} className="insight-card">
                <div className="insight-header">
                  <span className={`priority-badge ${getPriorityBadge(insight.priority).class}`}>
                    {getPriorityBadge(insight.priority).label}
                  </span>
                  <span className="insight-category">📂 {insight.category}</span>
                  <button 
                    className="dismiss-btn"
                    onClick={() => dismissInsight(insight.id)}
                    title="Dismiss this insight"
                  >
                    ✕
                  </button>
                </div>
                <h4>{insight.title}</h4>
                <p>{insight.description}</p>
                {insight.recommendation && (
                  <div className="insight-recommendation">
                    💡 <strong>Recommendation:</strong> {insight.recommendation}
                  </div>
                )}
                {insight.metric_value !== null && insight.metric_value !== undefined && (
                  <div className="insight-metric">
                    <span>📊 Value: {insight.metric_value}</span>
                    {insight.metric_change !== null && insight.metric_change !== undefined && (
                      <span className={insight.metric_change > 0 ? 'positive' : 'negative'}>
                        {insight.metric_change > 0 ? '↑' : '↓'} {Math.abs(insight.metric_change).toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
                <div className="insight-time">
                  🕐 {new Date(insight.created_at).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="no-data-message">
              <p>No insights available. Click "Generate Insights" to analyze your data.</p>
              <p style={{ fontSize: '13px', marginTop: '8px', color: '#94a3b8' }}>
                You need at least some orders and inventory data to generate insights.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <div className="predictions-list">
          {dashboardData.predictions && dashboardData.predictions.length > 0 ? (
            dashboardData.predictions.map((prediction) => (
              <div key={prediction.id} className="prediction-card">
                <div className="prediction-header">
                  <span className="prediction-type">
                    {prediction.prediction_type === 'revenue' ? '💰 Revenue' : '📦 Orders'}
                  </span>
                  <span className="confidence-badge">
                    🎯 {parseFloat(prediction.confidence).toFixed(0)}% confidence
                  </span>
                </div>
                <h4>Next Month Prediction</h4>
                <div className="prediction-values">
                  <div className="prediction-value">
                    <span className="label">Predicted</span>
                    <span className="value">
                      {prediction.prediction_type === 'revenue' 
                        ? `$${Math.round(prediction.predicted_value).toLocaleString()}`
                        : Math.round(prediction.predicted_value)
                      }
                    </span>
                  </div>
                  <div className="prediction-arrow">→</div>
                  <div className="prediction-value">
                    <span className="label">Date</span>
                    <span className="value">{new Date(prediction.prediction_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="prediction-footer">
                  <span className={`status-badge ${prediction.status}`}>
                    {getStatusBadge(prediction.status).label}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-data-message">
              <p>No predictions available. Generate insights to see predictions.</p>
            </div>
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="recommendations-list">
          {dashboardData.recommendations && dashboardData.recommendations.length > 0 ? (
            dashboardData.recommendations.map((rec) => (
              <div key={rec.id} className="recommendation-card">
                <div className="rec-header">
                  <span className={`impact-badge ${rec.impact}`}>
                    ⚡ {rec.impact} impact
                  </span>
                  <span className={`effort-badge ${rec.effort}`}>
                    📝 {rec.effort} effort
                  </span>
                </div>
                <h4>{rec.title}</h4>
                <p>{rec.description}</p>
                <div className="rec-actions">
                  <button 
                    className="btn-start"
                    onClick={() => updateRecommendation(rec.id, 'in-progress')}
                  >
                    ✅ Start
                  </button>
                  <button 
                    className="btn-dismiss"
                    onClick={() => updateRecommendation(rec.id, 'dismissed')}
                  >
                    ❌ Dismiss
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-data-message">
              <p>No recommendations available.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AIInsights;
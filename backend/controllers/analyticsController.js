const db = require('../config/db');

// Calculate Enterprise SOC KPIs and Telemetry
async function getDashboardMetrics(req, res) {
  try {
    const isEmployee = req.user.role === 'employee';
    let whereClause = '';
    const params = [];
    if (isEmployee) {
      whereClause = 'WHERE reporter_id = ?';
      params.push(req.user.id);
    }

    // 1. Overall counts by status & severity
    const [allIncidents] = await db.query(
      `SELECT id, tracking_id, severity, priority, status, incident_type, category, environment, created_at, resolved_at
       FROM incidents ${whereClause}`,
      params
    );

    const total = allIncidents.length;
    const critical = allIncidents.filter(i => i.severity === 'Critical').length;
    const high = allIncidents.filter(i => i.severity === 'High').length;
    const medium = allIncidents.filter(i => i.severity === 'Medium').length;
    const low = allIncidents.filter(i => i.severity === 'Low').length;

    const resolved = allIncidents.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;
    const contained = allIncidents.filter(i => i.status === 'Contained').length;
    const active = total - resolved;

    // Type distribution
    const typeDistribution = {};
    const categoryDistribution = {};
    for (const inc of allIncidents) {
      typeDistribution[inc.incident_type] = (typeDistribution[inc.incident_type] || 0) + 1;
      categoryDistribution[inc.category] = (categoryDistribution[inc.category] || 0) + 1;
    }

    // Status distribution
    const statusCounts = {
      Reported: allIncidents.filter(i => i.status === 'Reported').length,
      'In Triage': allIncidents.filter(i => i.status === 'In Triage').length,
      'Under Investigation': allIncidents.filter(i => i.status === 'Under Investigation').length,
      Contained: contained,
      Resolved: allIncidents.filter(i => i.status === 'Resolved').length,
      Closed: allIncidents.filter(i => i.status === 'Closed').length,
    };

    // Priority counts
    const priorityCounts = {
      P1: allIncidents.filter(i => i.priority?.includes('P1')).length,
      P2: allIncidents.filter(i => i.priority?.includes('P2')).length,
      P3: allIncidents.filter(i => i.priority?.includes('P3')).length,
      P4: allIncidents.filter(i => i.priority?.includes('P4')).length,
    };

    // Artifacts total count
    const [artifactCountRow] = await db.query('SELECT COUNT(*) as total FROM incident_artifacts');
    const totalArtifacts = artifactCountRow[0]?.total || 0;

    // Analysts count
    const [analystCountRow] = await db.query("SELECT COUNT(*) as total FROM users WHERE role = 'analyst'");
    const totalAnalysts = analystCountRow[0]?.total || 0;

    return res.json({
      success: true,
      data: {
        summary: {
          totalIncidents: total,
          activeInvestigations: active,
          criticalAlerts: critical,
          containedThreats: contained,
          resolvedIncidents: resolved,
          totalArtifactsTracked: totalArtifacts,
          activeSocAnalysts: totalAnalysts,
          containmentRate: total > 0 ? Math.round(((contained + resolved) / total) * 100) : 0
        },
        severityDistribution: {
          Critical: critical,
          High: high,
          Medium: medium,
          Low: low
        },
        statusPipeline: statusCounts,
        priorityBreakdown: priorityCounts,
        typeDistribution,
        categoryDistribution
      }
    });
  } catch (err) {
    console.error('[Analytics Controller] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to aggregate SOC metrics.' });
  }
}

module.exports = {
  getDashboardMetrics
};

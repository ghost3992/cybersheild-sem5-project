const db = require('../config/db');
const { logAuditAction } = require('../utils/auditLogger');

// Generate unique tracking ID: CS-YYYY-XXXX
function generateTrackingId() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CS-${year}-${randomSuffix}`;
}

// 1. Submit a New Incident
async function createIncident(req, res) {
  try {
    const {
      title,
      summary,
      description,
      incident_type = 'Other',
      category = 'Security Anomaly',
      severity = 'Medium',
      priority = 'P3 - Medium',
      impacted_assets = '',
      environment = 'Production',
      mitre_tactics = '',
      mitre_techniques = '',
      artifacts = []
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Incident title and detailed description are required.'
      });
    }

    const trackingId = generateTrackingId();
    const reporterId = req.user.id;

    const [result] = await db.query(
      `INSERT INTO incidents (
        tracking_id, title, summary, description, incident_type, category,
        severity, priority, status, reporter_id, assigned_to, impacted_assets,
        environment, mitre_tactics, mitre_techniques, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Reported', ?, NULL, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        trackingId,
        title.trim(),
        summary ? summary.trim() : null,
        description.trim(),
        incident_type,
        category,
        severity,
        priority,
        reporterId,
        impacted_assets ? impacted_assets.trim() : null,
        environment,
        mitre_tactics ? mitre_tactics.trim() : null,
        mitre_techniques ? mitre_techniques.trim() : null
      ]
    );

    const incidentId = result.insertId;

    // Insert initial timeline event
    await db.query(
      `INSERT INTO incident_timeline (incident_id, user_id, action, message, old_value, new_value, created_at)
       VALUES (?, ?, 'INCIDENT_REPORTED', 'Incident submitted through the reporting portal.', NULL, 'Reported', datetime('now'))`,
      [incidentId, reporterId]
    );

    // If artifacts were attached, insert them
    if (Array.isArray(artifacts) && artifacts.length > 0) {
      for (const art of artifacts) {
        if (art.type && art.value) {
          await db.query(
            `INSERT INTO incident_artifacts (incident_id, artifact_type, artifact_value, threat_score, description, source_ref, created_at)
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
            [
              incidentId,
              art.type,
              art.value,
              Number(art.threat_score) || 50,
              art.description || null,
              art.source_ref || 'unconfirmed'
            ]
          );
        }
      }
    }

    // Audit log
    await logAuditAction({
      req,
      action: 'INCIDENT_CREATED',
      details: `Created incident ${trackingId} [${severity} - ${incident_type}]`
    });

    return res.status(201).json({
      success: true,
      message: 'Incident successfully logged into CyberShield repository.',
      data: {
        id: incidentId,
        tracking_id: trackingId,
        title,
        severity,
        status: 'Reported',
        created_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[Incident Controller] Create error:', err);
    return res.status(500).json({
      success: false,
      message: 'Database error occurred while recording the incident.'
    });
  }
}

// 2. Query Incidents with Dynamic SQL Filters & Relational JOINs
async function getIncidents(req, res) {
  try {
    const {
      status,
      severity,
      incident_type,
      priority,
      assigned_to,
      search,
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      order = 'DESC'
    } = req.query;

    const isEmployee = req.user.role === 'employee';
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (parsedPage - 1) * parsedLimit;

    // Dynamic WHERE clauses
    const whereClauses = ['1=1'];
    const params = [];

    // RBAC: employees can only view incidents they reported
    if (isEmployee) {
      whereClauses.push('i.reporter_id = ?');
      params.push(req.user.id);
    }

    if (status && status !== 'all') {
      whereClauses.push('LOWER(i.status) = LOWER(?)');
      params.push(status);
    }

    if (severity && severity !== 'all') {
      whereClauses.push('LOWER(i.severity) = LOWER(?)');
      params.push(severity);
    }

    if (priority && priority !== 'all') {
      whereClauses.push('LOWER(i.priority) = LOWER(?)');
      params.push(priority);
    }

    if (incident_type && incident_type !== 'all') {
      whereClauses.push('LOWER(i.incident_type) = LOWER(?)');
      params.push(incident_type);
    }

    if (assigned_to && assigned_to !== 'all') {
      if (assigned_to === 'unassigned') {
        whereClauses.push('i.assigned_to IS NULL');
      } else {
        whereClauses.push('i.assigned_to = ?');
        params.push(Number(assigned_to));
      }
    }

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      whereClauses.push('(LOWER(i.title) LIKE ? OR LOWER(i.tracking_id) LIKE ? OR LOWER(i.impacted_assets) LIKE ? OR LOWER(i.description) LIKE ?)');
      params.push(q, q, q, q);
    }

    const whereSql = whereClauses.join(' AND ');

    // 1. Count query
    const countSql = `SELECT COUNT(*) as total FROM incidents i WHERE ${whereSql}`;
    const [countRows] = await db.query(countSql, params);
    const totalRecords = countRows[0].total || countRows[0]['COUNT(*)'] || 0;
    const totalPages = Math.ceil(totalRecords / parsedLimit) || 1;

    // Validate sort column to avoid SQL injection
    const allowedSort = ['created_at', 'updated_at', 'severity', 'status', 'title', 'tracking_id'];
    const safeSort = allowedSort.includes(sort_by) ? `i.${sort_by}` : 'i.created_at';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 2. Data query with Relational JOINs
    const dataSql = `
      SELECT
        i.*,
        u1.name AS reporter_name,
        u1.email AS reporter_email,
        u1.department AS reporter_department,
        u2.name AS assigned_name,
        u2.email AS assigned_email,
        u2.designation AS assigned_designation,
        (SELECT COUNT(*) FROM incident_artifacts a WHERE a.incident_id = i.id) AS artifact_count,
        (SELECT COUNT(*) FROM incident_comments c WHERE c.incident_id = i.id) AS comment_count
      FROM incidents i
      LEFT JOIN users u1 ON i.reporter_id = u1.id
      LEFT JOIN users u2 ON i.assigned_to = u2.id
      WHERE ${whereSql}
      ORDER BY ${safeSort} ${safeOrder}
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...params, parsedLimit, offset];
    const [rows] = await db.query(dataSql, dataParams);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalRecords,
        totalPages,
        hasNext: parsedPage < totalPages,
        hasPrev: parsedPage > 1
      }
    });
  } catch (err) {
    console.error('[Incident Controller] Query error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve incidents from repository.'
    });
  }
}

// 3. Get Full Incident Dossier (with Artifacts, Comments, and Timeline)
async function getIncidentById(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT
        i.*,
        u1.name AS reporter_name,
        u1.email AS reporter_email,
        u1.department AS reporter_department,
        u1.designation AS reporter_designation,
        u2.name AS assigned_name,
        u2.email AS assigned_email,
        u2.designation AS assigned_designation
      FROM incidents i
      LEFT JOIN users u1 ON i.reporter_id = u1.id
      LEFT JOIN users u2 ON i.assigned_to = u2.id
      WHERE i.id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Incident record not found.'
      });
    }

    const incident = rows[0];

    // RBAC: employee can only view their own incident
    if (req.user.role === 'employee' && incident.reporter_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access restricted to assigned SOC personnel or original reporter.'
      });
    }

    // Parallel relational queries for related sub-entities
    const [artifacts] = await db.query(
      'SELECT * FROM incident_artifacts WHERE incident_id = ? ORDER BY threat_score DESC, id ASC',
      [id]
    );

    const [comments] = await db.query(
      `SELECT
        c.*,
        u.name AS user_name,
        u.role AS user_role,
        u.department AS user_department,
        u.designation AS user_designation
      FROM incident_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.incident_id = ?
      ORDER BY c.created_at ASC`,
      [id]
    );

    const [timeline] = await db.query(
      `SELECT
        t.*,
        u.name AS user_name,
        u.role AS user_role
      FROM incident_timeline t
      JOIN users u ON t.user_id = u.id
      WHERE t.incident_id = ?
      ORDER BY t.created_at ASC`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        ...incident,
        artifacts,
        comments,
        timeline
      }
    });
  } catch (err) {
    console.error('[Incident Controller] Detail fetch error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to assemble incident dossier.'
    });
  }
}

// 4. Update Incident Triage & Response Details (Analyst / Admin)
async function updateIncident(req, res) {
  try {
    const { id } = req.params;
    const {
      status,
      severity,
      priority,
      containment_plan,
      root_cause,
      resolution_notes,
      mitre_tactics,
      mitre_techniques,
      impacted_assets,
      note
    } = req.body;

    const [existing] = await db.query('SELECT * FROM incidents WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    const current = existing[0];
    const newStatus = status || current.status;
    const newSeverity = severity || current.severity;
    const newPriority = priority || current.priority;

    // Handle lifecycle timestamp columns
    let timestampUpdates = '';
    if (newStatus === 'In Triage' && !current.triaged_at) {
      timestampUpdates = ", triaged_at = datetime('now')";
    } else if (newStatus === 'Contained' && !current.contained_at) {
      timestampUpdates = ", contained_at = datetime('now')";
    } else if (newStatus === 'Resolved' && !current.resolved_at) {
      timestampUpdates = ", resolved_at = datetime('now')";
    } else if (newStatus === 'Closed' && !current.closed_at) {
      timestampUpdates = ", closed_at = datetime('now')";
    }

    await db.query(
      `UPDATE incidents SET
        status = ?,
        severity = ?,
        priority = ?,
        containment_plan = ?,
        root_cause = ?,
        resolution_notes = ?,
        mitre_tactics = ?,
        mitre_techniques = ?,
        impacted_assets = ?,
        updated_at = datetime('now')
        ${timestampUpdates}
      WHERE id = ?`,
      [
        newStatus,
        newSeverity,
        newPriority,
        containment_plan !== undefined ? containment_plan : current.containment_plan,
        root_cause !== undefined ? root_cause : current.root_cause,
        resolution_notes !== undefined ? resolution_notes : current.resolution_notes,
        mitre_tactics !== undefined ? mitre_tactics : current.mitre_tactics,
        mitre_techniques !== undefined ? mitre_techniques : current.mitre_techniques,
        impacted_assets !== undefined ? impacted_assets : current.impacted_assets,
        id
      ]
    );

    // If status changed, record timeline transition
    if (newStatus !== current.status) {
      await db.query(
        `INSERT INTO incident_timeline (incident_id, user_id, action, message, old_value, new_value, created_at)
         VALUES (?, ?, 'STATUS_TRANSITION', ?, ?, ?, datetime('now'))`,
        [
          id,
          req.user.id,
          note || `Incident lifecycle transition: ${current.status} ➔ ${newStatus}`,
          current.status,
          newStatus
        ]
      );
    } else if (note) {
      await db.query(
        `INSERT INTO incident_timeline (incident_id, user_id, action, message, old_value, new_value, created_at)
         VALUES (?, ?, 'TRIAGE_UPDATE', ?, NULL, NULL, datetime('now'))`,
        [id, req.user.id, note]
      );
    }

    await logAuditAction({
      req,
      action: 'INCIDENT_UPDATED',
      details: `Updated incident ${current.tracking_id} [Status: ${newStatus}, Severity: ${newSeverity}]`
    });

    return res.json({
      success: true,
      message: 'Incident details updated successfully.'
    });
  } catch (err) {
    console.error('[Incident Controller] Update error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update incident record.' });
  }
}

// 5. Assign Incident to Analyst (Analyst / Admin)
async function assignIncident(req, res) {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body; // user_id or null

    const [existing] = await db.query('SELECT tracking_id, assigned_to FROM incidents WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    let assigneeName = 'Unassigned';
    if (assigned_to) {
      const [u] = await db.query('SELECT name FROM users WHERE id = ?', [assigned_to]);
      if (u.length > 0) assigneeName = u[0].name;
    }

    await db.query(
      `UPDATE incidents SET assigned_to = ?, updated_at = datetime('now') WHERE id = ?`,
      [assigned_to ? Number(assigned_to) : null, id]
    );

    await db.query(
      `INSERT INTO incident_timeline (incident_id, user_id, action, message, old_value, new_value, created_at)
       VALUES (?, ?, 'ANALYST_ASSIGNED', ?, NULL, ?, datetime('now'))`,
      [id, req.user.id, `Case assigned to ${assigneeName}.`, assigneeName]
    );

    await logAuditAction({
      req,
      action: 'INCIDENT_ASSIGNED',
      details: `Assigned ${existing[0].tracking_id} to ${assigneeName}`
    });

    return res.json({
      success: true,
      message: `Incident ownership reassigned to ${assigneeName}.`
    });
  } catch (err) {
    console.error('[Incident Controller] Assign error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update case assignment.' });
  }
}

// 6. Post Investigation Comment
async function addComment(req, res) {
  try {
    const { id } = req.params;
    const { comment, is_internal = 1 } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
    }

    const [result] = await db.query(
      `INSERT INTO incident_comments (incident_id, user_id, comment, is_internal, created_at, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, req.user.id, comment.trim(), is_internal ? 1 : 0]
    );

    return res.status(201).json({
      success: true,
      message: 'Comment posted to case file.',
      commentId: result.insertId
    });
  } catch (err) {
    console.error('[Incident Controller] Add comment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record comment.' });
  }
}

// 7. Add Technical Artifact / IOC Observable
async function addArtifact(req, res) {
  try {
    const { id } = req.params;
    const { artifact_type, artifact_value, threat_score = 50, description = '', source_ref = 'unconfirmed' } = req.body;

    if (!artifact_type || !artifact_value) {
      return res.status(400).json({ success: false, message: 'Artifact type and value are required.' });
    }

    const [result] = await db.query(
      `INSERT INTO incident_artifacts (incident_id, artifact_type, artifact_value, threat_score, description, source_ref, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [id, artifact_type, artifact_value.trim(), Number(threat_score) || 50, description.trim(), source_ref]
    );

    await db.query(
      `INSERT INTO incident_timeline (incident_id, user_id, action, message, old_value, new_value, created_at)
       VALUES (?, ?, 'ARTIFACT_ATTACHED', ?, NULL, ?, datetime('now'))`,
      [id, req.user.id, `Attached observable IOC: [${artifact_type}] ${artifact_value}`, artifact_value]
    );

    return res.status(201).json({
      success: true,
      message: 'Observable registered into incident dossier.',
      artifactId: result.insertId
    });
  } catch (err) {
    console.error('[Incident Controller] Add artifact error:', err);
    return res.status(500).json({ success: false, message: 'Failed to attach artifact.' });
  }
}

// 8. Delete Technical Artifact
async function deleteArtifact(req, res) {
  try {
    const { id, artifactId } = req.params;
    await db.query('DELETE FROM incident_artifacts WHERE id = ? AND incident_id = ?', [artifactId, id]);
    return res.json({ success: true, message: 'Artifact removed from dossier.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete artifact.' });
  }
}

// 9. Export Incidents as CSV (Enterprise Data Export)
async function exportCsv(req, res) {
  try {
    const isEmployee = req.user.role === 'employee';
    let sql = `
      SELECT
        i.tracking_id, i.title, i.severity, i.priority, i.status, i.incident_type,
        i.environment, i.impacted_assets, u1.name as reporter, u2.name as assignee,
        i.created_at, i.resolved_at
      FROM incidents i
      LEFT JOIN users u1 ON i.reporter_id = u1.id
      LEFT JOIN users u2 ON i.assigned_to = u2.id
    `;
    const params = [];
    if (isEmployee) {
      sql += ' WHERE i.reporter_id = ?';
      params.push(req.user.id);
    }
    sql += ' ORDER BY i.created_at DESC';

    const [rows] = await db.query(sql, params);

    const headers = ['Tracking ID', 'Title', 'Severity', 'Priority', 'Status', 'Type', 'Environment', 'Assets', 'Reporter', 'Assignee', 'Created At', 'Resolved At'];
    const csvLines = [headers.join(',')];

    for (const r of rows) {
      const escape = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
      csvLines.push([
        escape(r.tracking_id),
        escape(r.title),
        escape(r.severity),
        escape(r.priority),
        escape(r.status),
        escape(r.incident_type),
        escape(r.environment),
        escape(r.impacted_assets),
        escape(r.reporter),
        escape(r.assignee || 'Unassigned'),
        escape(r.created_at),
        escape(r.resolved_at || 'Unresolved')
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=cybershield_incidents_${Date.now()}.csv`);
    return res.status(200).send(csvLines.join('\n'));
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to generate CSV export.' });
  }
}

// 10. Delete Incident (Admin only)
async function deleteIncident(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT tracking_id FROM incidents WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    await db.query('DELETE FROM incidents WHERE id = ?', [id]);
    await logAuditAction({
      req,
      action: 'INCIDENT_DELETED',
      details: `Permanently expunged record ${rows[0].tracking_id}`
    });

    return res.json({ success: true, message: 'Incident record successfully removed.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to expunge incident record.' });
  }
}

// 11. Generate CyberShield IR Agent DRAFT JSON Report
async function generateDraftReport(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT i.*, u1.name as reporter_name, u2.name as assigned_name
       FROM incidents i
       LEFT JOIN users u1 ON i.reporter_id = u1.id
       LEFT JOIN users u2 ON i.assigned_to = u2.id
       WHERE i.id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    const inc = rows[0];

    const [artifacts] = await db.query(
      'SELECT artifact_type, artifact_value, threat_score, description, source_ref FROM incident_artifacts WHERE incident_id = ?',
      [id]
    );

    const [timeline] = await db.query(
      `SELECT t.created_at as timestamp, t.action, t.message as details, u.name as actor
       FROM incident_timeline t
       JOIN users u ON t.user_id = u.id
       WHERE t.incident_id = ?
       ORDER BY t.created_at ASC`,
      [id]
    );

    const draftReport = {
      report_schema_version: '2.0.0-draft',
      generated_by: 'CyberShield IR Agent',
      classification: 'RESTRICTED // LAW ENFORCEMENT & SOC INTERNAL USE ONLY',
      timestamp: new Date().toISOString(),
      disclaimer: 'Store metadata only. Never access or store raw leaked credentials. All claims cited as publicly reported or unconfirmed.',
      incident_summary: {
        tracking_id: inc.tracking_id,
        title: inc.title,
        severity: inc.severity,
        priority: inc.priority,
        status: inc.status,
        incident_type: inc.incident_type,
        category: inc.category,
        impacted_assets: inc.impacted_assets || 'unconfirmed',
        environment: inc.environment || 'Production',
        mitre_attack_tactics: inc.mitre_tactics || 'unconfirmed',
        mitre_attack_techniques: inc.mitre_techniques || 'unconfirmed',
        reported_at: inc.created_at,
        containment_status: inc.containment_plan ? 'publicly reported' : 'unconfirmed',
        containment_actions: inc.containment_plan || 'unconfirmed',
        root_cause: inc.root_cause || 'unconfirmed',
        resolution_summary: inc.resolution_notes || 'unconfirmed'
      },
      indicators_and_observables: artifacts.map(a => ({
        type: a.artifact_type,
        observable: a.artifact_value,
        threat_score: a.threat_score,
        attribution: a.source_ref,
        description: a.description
      })),
      investigation_timeline: timeline,
      grounded_sources: [
        {
          source: 'CISA Cybersecurity Advisories & Alerts',
          status: 'publicly reported',
          url: 'https://www.cisa.gov/news-events/cybersecurity-advisories'
        },
        {
          source: 'NIST NVD (National Vulnerability Database)',
          status: 'publicly reported',
          url: 'https://nvd.nist.gov/'
        },
        {
          source: 'MITRE ATT&CK Enterprise Matrix',
          status: 'publicly reported',
          url: 'https://attack.mitre.org/'
        },
        {
          source: 'Have I Been Pwned (HIBP) Breach Index',
          status: 'publicly reported',
          url: 'https://haveibeenpwned.com/'
        }
      ]
    };

    return res.json({
      success: true,
      report: draftReport
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to compile DRAFT incident report.' });
  }
}

module.exports = {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
  assignIncident,
  addComment,
  addArtifact,
  deleteArtifact,
  exportCsv,
  deleteIncident,
  generateDraftReport
};

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

let dbDriver = null; // 'mysql' | 'sqlite'
let pool = null;      // mysql2 pool
let sqliteDb = null;  // node:sqlite DatabaseSync instance

const SQLITE_FILE = path.join(__dirname, '..', 'data', 'cybershield.db');

/**
 * Universal SQL Query runner:
 * Works identically for MySQL2 and SQLite
 */
async function query(sql, params = []) {
  if (dbDriver === 'mysql' && pool) {
    return pool.query(sql, params);
  } else if (dbDriver === 'sqlite' && sqliteDb) {
    try {
      const trimmed = sql.trim();
      const isSelect = /^select/i.test(trimmed) || /^pragma/i.test(trimmed);
      const isInsert = /^insert/i.test(trimmed);
      const isUpdate = /^update/i.test(trimmed);
      const isDelete = /^delete/i.test(trimmed);

      // Handle MySQL-specific syntax replacements for SQLite if any
      let sqliteSql = sql
        .replace(/NOW\(\)/gi, "datetime('now')")
        .replace(/INTERVAL \d+ DAY/gi, "'-2 days'")
        .replace(/INTERVAL \d+ HOUR/gi, "'-4 hours'")
        .replace(/ENGINE=InnoDB/gi, "")
        .replace(/DEFAULT CHARSET=utf8mb4/gi, "")
        .replace(/COLLATE utf8mb4_unicode_ci/gi, "")
        .replace(/CHARACTER SET utf8mb4/gi, "")
        .replace(/AUTO_INCREMENT/gi, "AUTOINCREMENT");

      const stmt = sqliteDb.prepare(sqliteSql);

      // SQLite expects primitives or nulls
      const cleanParams = params.map(p => {
        if (p === undefined) return null;
        if (typeof p === 'object' && p !== null) return JSON.stringify(p);
        return p;
      });

      if (isSelect) {
        const rows = stmt.all(...cleanParams);
        return [rows, null];
      } else {
        const result = stmt.run(...cleanParams);
        return [{
          insertId: Number(result.lastInsertRowid),
          affectedRows: result.changes
        }, null];
      }
    } catch (err) {
      console.error('[DB Query Error]', err.message, 'in SQL:', sql);
      throw err;
    }
  } else {
    throw new Error('Database is not initialized.');
  }
}

/**
 * Seed realistic enterprise incident dataset
 */
async function seedDefaultData() {
  const hash = await bcrypt.hash('Password@123', 10);

  // 1. Check existing users
  const [existingUsers] = await query('SELECT count(*) as count FROM users');
  const count = existingUsers[0].count || existingUsers[0]['count(*)'] || 0;
  if (Number(count) > 0) return;

  console.log('[CyberShield DB] Seeding enterprise security dataset...');

  // Users
  const users = [
    [1, 'Vikram Malhotra', 'admin@cybershield.org', hash, 'admin', 'Security Operations (SOC)', 'Head of Information Security', '+1 (555) 019-2831', 1],
    [2, 'Sarah Chen, CISSP', 'sarah.analyst@cybershield.org', hash, 'analyst', 'Threat Intelligence & Response', 'Lead SOC Investigator', '+1 (555) 019-4421', 1],
    [3, 'Alex Rivera, CEH', 'alex.analyst@cybershield.org', hash, 'analyst', 'Incident Triage', 'Senior Incident Responder', '+1 (555) 019-7812', 1],
    [4, 'David Miller', 'david.miller@company.com', hash, 'employee', 'Finance & Accounting', 'Payroll Operations Specialist', '+1 (555) 019-3382', 1],
    [5, 'Emily Blunt', 'emily.blunt@company.com', hash, 'employee', 'People Operations / HR', 'HR Director', '+1 (555) 019-5509', 1],
    [6, 'Marcus Vance', 'marcus.vance@company.com', hash, 'employee', 'Infrastructure & Cloud', 'DevOps Staff Engineer', '+1 (555) 019-8923', 1]
  ];

  for (const u of users) {
    await query(
      `INSERT INTO users (id, name, email, password, role, department, designation, phone, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-30 days'))`,
      u
    );
  }

  // Incidents
  const sampleIncidents = [
    {
      id: 1,
      tracking_id: 'CS-2026-0001',
      title: 'Targeted Executive Spear-Phishing Campaign (Payroll Spoofing)',
      summary: 'High-confidence credential harvesting lure impersonating ADP / Internal HR portal received by 14 finance staff.',
      description: 'Multiple employees in Finance received emails claiming to be from HR requesting immediate login to an external domain "secure-payro11-update.com" to update tax information before the fiscal quarter close. Email headers confirm SPF/DKIM failure originating from an external VPS in Romania.',
      incident_type: 'Phishing',
      category: 'Social Engineering',
      severity: 'High',
      priority: 'P2 - High',
      status: 'Under Investigation',
      reporter_id: 4,
      assigned_to: 2,
      impacted_assets: 'Mail Server Exchange (US-East), WS-FIN-04, WS-FIN-09',
      environment: 'Production',
      mitre_tactics: 'Initial Access, Credential Access',
      mitre_techniques: 'T1566.002 (Spearphishing Link), T1078 (Valid Accounts)',
      containment_plan: '1. Sinkhole destination domain on Cloudflare and local DNS.\n2. Invalidate Azure AD sessions for 14 targeted recipients.\n3. Search Microsoft 365 message trace and purge identical message IDs.',
      root_cause: 'Publicly exposed employee directory coupled with absence of DMARC reject enforcement on partner subdomain.',
      resolution_notes: null,
      created_at: "datetime('now', '-2 days')",
      triaged_at: "datetime('now', '-44 hours')"
    },
    {
      id: 2,
      tracking_id: 'CS-2026-0002',
      title: 'Ransomware Canary Alert: Encrypted Headers on Backup NAS Volume',
      summary: 'EDR canary file modification alert triggered on daily backup share NAS-02 with rapid file entropy increase.',
      description: 'SentinelOne agent on NAS-02 flagged mass file renames with an unrecognized extension ".crypted_lock" and dropped ransom note "RESTORE_README.txt". The process was originating from an authenticated SMB session tied to compromised service account svc-backup-sync.',
      incident_type: 'Ransomware',
      category: 'Malware',
      severity: 'Critical',
      priority: 'P1 - Critical',
      status: 'Contained',
      reporter_id: 1,
      assigned_to: 2,
      impacted_assets: 'NAS-02 Backup Storage (Subnet 10.0.4.0/24), Hyper-V Host cluster',
      environment: 'Production Backup',
      mitre_tactics: 'Impact, Defense Evasion, Lateral Movement',
      mitre_techniques: 'T1486 (Data Encrypted for Impact), T1070 (Indicator Removal), T1021.002 (SMB/Windows Admin Shares)',
      containment_plan: '1. Network interface on NAS-02 administratively shutdown via core switch.\n2. svc-backup-sync account disabled in Active Directory.\n3. Verified air-gapped immutable AWS S3 Glacier snapshots remain uncompromised.',
      root_cause: 'Hardcoded plaintext credentials discovered in legacy backup maintenance script on decommissioned staging host.',
      resolution_notes: null,
      created_at: "datetime('now', '-1 days')",
      triaged_at: "datetime('now', '-22 hours')"
    },
    {
      id: 3,
      tracking_id: 'CS-2026-0003',
      title: 'Automated Botnet Brute Force Against Public SSH Bastion',
      summary: 'Firewall detected >48,000 failed authentication attempts within 30 minutes targeting root and admin accounts.',
      description: 'Distributed botnet nodes originating from known bulletproof hosting providers launched automated dictionary attacks against bastion-gw.corp.net on port 22. Fail2ban rules engaged, but volumetric spike caused intermittent gateway latency.',
      incident_type: 'Unauthorized Access',
      category: 'Access Violation',
      severity: 'Medium',
      priority: 'P3 - Medium',
      status: 'Resolved',
      reporter_id: 3,
      assigned_to: 3,
      impacted_assets: 'Edge Bastion GW-01 (IP 198.51.100.12)',
      environment: 'Perimeter Network',
      mitre_tactics: 'Credential Access',
      mitre_techniques: 'T1110.001 (Password Guessing), T1110.003 (Password Spraying)',
      containment_plan: '1. Immediate GeoIP block of offending ASN ranges.\n2. Disabled password authentication entirely in sshd_config.\n3. Enforced WireGuard VPN requirement prior to bastion reachability.',
      root_cause: 'Legacy configuration drift exposed SSH port directly to 0.0.0.0/0 following maintenance window.',
      resolution_notes: 'SSH access restricted to internal WireGuard VPN subnet only. Ed25519 hardware key authentication enforced company-wide. Bastion health stabilized.',
      created_at: "datetime('now', '-4 days')",
      triaged_at: "datetime('now', '-3 days')"
    },
    {
      id: 4,
      tracking_id: 'CS-2026-0004',
      title: 'Suspicious Database Exfiltration Spike via Customer API',
      summary: 'Anomalous query pattern downloading 85,000 contact records via unthrottled API endpoint.',
      description: 'CloudWatch anomaly detector flagged a 400% surge in egress traffic from the internal customer portal API. An external IP from Tor exit node was iterating through customer account IDs sequentially without triggering standard 429 rate limits.',
      incident_type: 'Data Breach',
      category: 'Data Exfiltration',
      severity: 'Critical',
      priority: 'P1 - Critical',
      status: 'In Triage',
      reporter_id: 2,
      assigned_to: null,
      impacted_assets: 'Customer-DB-Primary (Port 3306), API Gateway Cluster',
      environment: 'Production',
      mitre_tactics: 'Exfiltration, Collection',
      mitre_techniques: 'T1530 (Data from Cloud Storage/Object), T1567 (Exfiltration Over Web Service)',
      containment_plan: '1. Revoked API authorization token utilized by the scraper.\n2. Injected WAF rule blocking all recognized Tor exit node IP addresses.\n3. Applied token-bucket rate limiter to customer enumeration route.',
      root_cause: 'Broken Object Level Authorization (BOLA) in newly deployed v2 customer directory endpoint.',
      resolution_notes: null,
      created_at: "datetime('now', '-6 hours')",
      triaged_at: "datetime('now', '-5 hours')"
    },
    {
      id: 5,
      tracking_id: 'CS-2026-0005',
      title: 'Cryptomining Payload Discovered on Staging Kubernetes Node',
      summary: 'XMRig miner container running under kube-system namespace consuming 100% CPU.',
      description: 'Datadog CPU threshold alerts on worker-node-k8s-07 triggered after sustained 100% utilization. Inspection revealed an anomalous container "coredns-cache-worker" pulling an image from public DockerHub repository with embedded XMRig configuration.',
      incident_type: 'Malware',
      category: 'Cryptojacking',
      severity: 'High',
      priority: 'P2 - High',
      status: 'Under Investigation',
      reporter_id: 6,
      assigned_to: 3,
      impacted_assets: 'k8s-worker-node-07, Staging Cluster VPC',
      environment: 'Staging',
      mitre_tactics: 'Execution, Persistence, Resource Hijacking',
      mitre_techniques: 'T1496 (Resource Hijacking), T1610 (Deploy Container)',
      containment_plan: '1. Drained and cordoned worker node.\n2. Terminated rogue pod and deleted malicious deployment manifest.\n3. Rotated Kubernetes service account tokens.',
      root_cause: 'Misconfigured kubelet API port 10250 with anonymous authentication enabled during testing.',
      resolution_notes: null,
      created_at: "datetime('now', '-18 hours')",
      triaged_at: "datetime('now', '-16 hours')"
    }
  ];

  for (const inc of sampleIncidents) {
    await query(
      `INSERT INTO incidents (
        id, tracking_id, title, summary, description, incident_type, category, severity, priority, status,
        reporter_id, assigned_to, impacted_assets, environment, mitre_tactics, mitre_techniques,
        containment_plan, root_cause, resolution_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${inc.created_at}, datetime('now'))`,
      [
        inc.id, inc.tracking_id, inc.title, inc.summary, inc.description, inc.incident_type, inc.category,
        inc.severity, inc.priority, inc.status, inc.reporter_id, inc.assigned_to, inc.impacted_assets,
        inc.environment, inc.mitre_tactics, inc.mitre_techniques, inc.containment_plan, inc.root_cause,
        inc.resolution_notes
      ]
    );
  }

  // Artifacts / IOCs
  const sampleArtifacts = [
    [1, 1, 'IPv4', '198.51.100.23', 92, 'Adversary mail delivery source IP (Hostinger VPS in Romania)', 'publicly reported - CISA Alert AA24-110A'],
    [2, 1, 'Domain', 'secure-payro11-update.com', 98, 'Typosquatted domain mimicking payroll provider ADP', 'publicly reported - VirusTotal 14/88 detections'],
    [3, 1, 'SHA256', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 85, 'Malicious macro-enabled payload tax_update_q3.xlsm', 'publicly reported - Hybrid Analysis Sandbox'],
    [4, 2, 'File', 'RESTORE_README.txt', 100, 'Ransom payment instructions and Bitcoin wallet identifier', 'unconfirmed - Internal triage forensics'],
    [5, 2, 'IPv4', '203.0.113.88', 95, 'Command and Control (C2) server callback destination', 'publicly reported - AbuseIPDB blacklisted'],
    [6, 3, 'CIDR', '185.220.101.0/24', 80, 'Known Tor exit node cluster launching SSH attacks', 'publicly reported - Dan.me.uk Tor List'],
    [7, 4, 'IPv4', '194.26.29.112', 90, 'Scraper source IP extracting customer contact database', 'unconfirmed - Web server access log']
  ];

  for (const a of sampleArtifacts) {
    await query(
      `INSERT INTO incident_artifacts (id, incident_id, artifact_type, artifact_value, threat_score, description, source_ref, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-1 days'))`,
      a
    );
  }

  // Timeline events
  const timelineEvents = [
    [1, 1, 4, 'INCIDENT_REPORTED', 'Incident submitted by reporter David Miller via web portal.', null, 'Reported'],
    [2, 1, 1, 'ANALYST_ASSIGNED', 'Security Admin Vikram Malhotra assigned incident to Lead Investigator Sarah Chen.', null, 'Assigned: Sarah Chen'],
    [3, 1, 2, 'STATUS_TRANSITION', 'Status updated from Reported to Under Investigation following initial header analysis.', 'Reported', 'Under Investigation'],
    [4, 1, 2, 'CONTAINMENT_ACTION', 'Domain secure-payro11-update.com sinkholed across enterprise DNS and firewall.', null, 'Sinkhole Activated'],
    [5, 2, 1, 'INCIDENT_REPORTED', 'Critical canary alert triggered on NAS-02 backup repository.', null, 'Reported'],
    [6, 2, 2, 'STATUS_TRANSITION', 'Network interface severed on NAS host. Threat contained.', 'In Triage', 'Contained'],
    [7, 3, 3, 'STATUS_TRANSITION', 'Firewall rules tightened and SSH password auth disabled. Incident marked resolved.', 'Under Investigation', 'Resolved']
  ];

  for (const t of timelineEvents) {
    await query(
      `INSERT INTO incident_timeline (id, incident_id, user_id, action, message, old_value, new_value, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-18 hours'))`,
      t
    );
  }

  // Comments / Collaboration
  const comments = [
    [1, 1, 2, 'Analyzed the email attachment in Any.Run sandbox. It contacts the Romanian C2 IP within 8 seconds of macro execution. Recommending company-wide inbox sweep.', 1],
    [2, 1, 1, 'Approved. Microsoft 365 sweep initiated. 14 identical messages quarantined automatically.', 1],
    [3, 2, 2, 'Air-gapped AWS Glacier backup verified intact as of 04:00 AM UTC. No lateral spread to hypervisor host observed.', 1],
    [4, 3, 3, 'Fail2ban threshold lowered to 3 failed attempts within 10 minutes. Cloudflare WAF rule deployed for edge protection.', 0]
  ];

  for (const c of comments) {
    await query(
      `INSERT INTO incident_comments (id, incident_id, user_id, comment, is_internal, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now', '-12 hours'))`,
      c
    );
  }

  // Audit Logs
  const auditLogs = [
    [1, 1, 'SYSTEM_INIT', 'system', 0, '127.0.0.1', 'Node/Chrome', 'CyberShield incident tracking schema & database initialized successfully.'],
    [2, 4, 'INCIDENT_CREATED', 'incidents', 1, '192.168.1.45', 'Mozilla/5.0', 'Submitted incident CS-2026-0001 (Spear-phishing lure)'],
    [3, 1, 'INCIDENT_ASSIGNED', 'incidents', 1, '192.168.1.10', 'Mozilla/5.0', 'Assigned incident CS-2026-0001 to Sarah Chen'],
    [4, 2, 'STATUS_UPDATED', 'incidents', 1, '192.168.1.12', 'Mozilla/5.0', 'Moved CS-2026-0001 status to Under Investigation']
  ];

  for (const a of auditLogs) {
    await query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, ip_address, user_agent, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 days'))`,
      a
    );
  }

  console.log('[CyberShield DB] ✅ Enterprise security dataset loaded successfully.');
}

/**
 * Initialize Database Engine (MySQL or SQLite fallback)
 */
async function initializeDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = Number(process.env.DB_PORT) || 3306;
  const database = process.env.DB_NAME || 'cybershield_db';

  // 1. Check if user configured MySQL and if MySQL server is reachable
  let mysqlAvailable = false;
  try {
    const mysql = require('mysql2/promise');
    const testConn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      connectTimeout: 2000
    });
    await testConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await testConn.end();

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10
    });

    // Test pool
    const conn = await pool.getConnection();
    conn.release();
    mysqlAvailable = true;
    dbDriver = 'mysql';
    console.log(`[CyberShield DB] ✅ Connected to MySQL 8.0 on ${host}:${port}/${database}`);
  } catch (err) {
    // MySQL not running or not configured
    mysqlAvailable = false;
  }

  if (!mysqlAvailable) {
    // Use Node's built-in SQLite engine
    console.log(`[CyberShield DB] ℹ️  MySQL not active on localhost:3306. Activating high-performance Relational SQLite Engine.`);
    const { DatabaseSync } = require('node:sqlite');
    const dataDir = path.dirname(SQLITE_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    sqliteDb = new DatabaseSync(SQLITE_FILE);
    dbDriver = 'sqlite';
    console.log(`[CyberShield DB] ✅ Connected to Relational SQLite storage at: ${SQLITE_FILE}`);
  }

  // Create Relational Tables
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(30) NOT NULL DEFAULT 'employee',
      department VARCHAR(100) NOT NULL DEFAULT 'IT / General',
      designation VARCHAR(100) DEFAULT 'Staff',
      phone VARCHAR(50) DEFAULT NULL,
      is_active INTEGER DEFAULT 1,
      last_login_at TIMESTAMP DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_id VARCHAR(30) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      summary TEXT DEFAULT NULL,
      description TEXT NOT NULL,
      incident_type VARCHAR(60) NOT NULL DEFAULT 'Other',
      category VARCHAR(60) NOT NULL DEFAULT 'Security Anomaly',
      severity VARCHAR(30) NOT NULL DEFAULT 'Medium',
      priority VARCHAR(30) NOT NULL DEFAULT 'P3 - Medium',
      status VARCHAR(40) NOT NULL DEFAULT 'Reported',
      reporter_id INTEGER NOT NULL,
      assigned_to INTEGER DEFAULT NULL,
      impacted_assets VARCHAR(255) DEFAULT NULL,
      environment VARCHAR(50) DEFAULT 'Production',
      mitre_tactics VARCHAR(255) DEFAULT NULL,
      mitre_techniques VARCHAR(255) DEFAULT NULL,
      containment_plan TEXT DEFAULT NULL,
      root_cause TEXT DEFAULT NULL,
      resolution_notes TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      triaged_at TIMESTAMP DEFAULT NULL,
      contained_at TIMESTAMP DEFAULT NULL,
      resolved_at TIMESTAMP DEFAULT NULL,
      closed_at TIMESTAMP DEFAULT NULL,
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS incident_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      action VARCHAR(60) NOT NULL,
      message TEXT NOT NULL,
      old_value VARCHAR(100) DEFAULT NULL,
      new_value VARCHAR(100) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS incident_artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      artifact_type VARCHAR(40) NOT NULL,
      artifact_value VARCHAR(255) NOT NULL,
      threat_score INTEGER DEFAULT 50,
      description TEXT DEFAULT NULL,
      source_ref VARCHAR(255) DEFAULT 'unconfirmed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS incident_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      is_internal INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT NULL,
      action VARCHAR(80) NOT NULL,
      entity_type VARCHAR(50) DEFAULT 'general',
      entity_id INTEGER DEFAULT NULL,
      ip_address VARCHAR(60) DEFAULT '127.0.0.1',
      user_agent TEXT DEFAULT NULL,
      details TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default data if empty
  await seedDefaultData();
  return true;
}

function getDbStatus() {
  return {
    engine: dbDriver === 'mysql' ? 'MySQL 8.0' : 'Node Relational SQLite Engine',
    dialect: dbDriver === 'mysql' ? 'MySQL' : 'SQLite',
    active: true,
    file: dbDriver === 'sqlite' ? SQLITE_FILE : null,
    host: dbDriver === 'mysql' ? (process.env.DB_HOST || 'localhost') : 'local',
    database: dbDriver === 'mysql' ? (process.env.DB_NAME || 'cybershield_db') : 'cybershield.db'
  };
}

module.exports = {
  initializeDatabase,
  query,
  getDbStatus
};

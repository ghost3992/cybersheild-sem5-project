-- ====================================================================
-- CyberShield - Sample Enterprise Incident Dataset
-- Password for all seeded users: Password@123
-- ====================================================================

USE cybershield_db;

-- 1. Insert Users
INSERT INTO users (id, name, email, password, role, department, designation, phone, is_active)
VALUES
(1, 'Vikram Malhotra', 'admin@cybershield.org', '$2a$10$7R3gZ6L19qA2ZlG6tV2Qae87nL8g3lM4nO5pQ6rS7tU8vW9xY0z1a', 'admin', 'Security Operations (SOC)', 'Head of Information Security', '+1 (555) 019-2831', 1),
(2, 'Sarah Chen, CISSP', 'sarah.analyst@cybershield.org', '$2a$10$7R3gZ6L19qA2ZlG6tV2Qae87nL8g3lM4nO5pQ6rS7tU8vW9xY0z1a', 'analyst', 'Threat Intelligence & Response', 'Lead SOC Investigator', '+1 (555) 019-4421', 1),
(3, 'Alex Rivera, CEH', 'alex.analyst@cybershield.org', '$2a$10$7R3gZ6L19qA2ZlG6tV2Qae87nL8g3lM4nO5pQ6rS7tU8vW9xY0z1a', 'analyst', 'Incident Triage', 'Senior Incident Responder', '+1 (555) 019-7812', 1),
(4, 'David Miller', 'david.miller@company.com', '$2a$10$7R3gZ6L19qA2ZlG6tV2Qae87nL8g3lM4nO5pQ6rS7tU8vW9xY0z1a', 'employee', 'Finance & Accounting', 'Payroll Operations Specialist', '+1 (555) 019-3382', 1),
(5, 'Emily Blunt', 'emily.blunt@company.com', '$2a$10$7R3gZ6L19qA2ZlG6tV2Qae87nL8g3lM4nO5pQ6rS7tU8vW9xY0z1a', 'employee', 'People Operations / HR', 'HR Director', '+1 (555) 019-5509', 1),
(6, 'Marcus Vance', 'marcus.vance@company.com', '$2a$10$7R3gZ6L19qA2ZlG6tV2Qae87nL8g3lM4nO5pQ6rS7tU8vW9xY0z1a', 'employee', 'Infrastructure & Cloud', 'DevOps Staff Engineer', '+1 (555) 019-8923', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Insert Incidents
INSERT INTO incidents (
    id, tracking_id, title, summary, description, incident_type, category, severity, priority, status,
    reporter_id, assigned_to, impacted_assets, environment, mitre_tactics, mitre_techniques,
    containment_plan, root_cause, resolution_notes, created_at, updated_at
)
VALUES
(
    1,
    'CS-2026-0001',
    'Targeted Executive Spear-Phishing Campaign (Payroll Spoofing)',
    'High-confidence credential harvesting lure impersonating ADP / Internal HR portal received by 14 finance staff.',
    'Multiple employees in Finance received emails claiming to be from HR requesting immediate login to an external domain "secure-payro11-update.com" to update tax information before fiscal quarter close. Email headers confirm SPF/DKIM failure originating from an external Hostinger VPS in Romania.',
    'Phishing',
    'Social Engineering',
    'High',
    'P2 - High',
    'Under Investigation',
    4,
    2,
    'Mail Server Exchange (US-East), WS-FIN-04, WS-FIN-09',
    'Production',
    'Initial Access, Credential Access',
    'T1566.002 (Spearphishing Link), T1078 (Valid Accounts)',
    '1. Sinkhole destination domain on Cloudflare and local DNS.\n2. Invalidate Azure AD sessions for 14 targeted recipients.\n3. Search Microsoft 365 message trace and purge identical message IDs.',
    'Publicly exposed employee directory coupled with absence of DMARC reject enforcement on partner subdomain.',
    NULL,
    NOW() - INTERVAL 2 DAY,
    NOW()
),
(
    2,
    'CS-2026-0002',
    'Ransomware Canary Alert: Encrypted Headers on Backup NAS Volume',
    'EDR canary file modification alert triggered on daily backup share NAS-02 with rapid file entropy increase.',
    'SentinelOne agent on NAS-02 flagged mass file renames with an unrecognized extension ".crypted_lock" and dropped ransom note "RESTORE_README.txt". The process was originating from an authenticated SMB session tied to compromised service account svc-backup-sync.',
    'Ransomware',
    'Malware',
    'Critical',
    'P1 - Critical',
    'Contained',
    1,
    2,
    'NAS-02 Backup Storage (Subnet 10.0.4.0/24), Hyper-V Host cluster',
    'Production Backup',
    'Impact, Defense Evasion, Lateral Movement',
    'T1486 (Data Encrypted for Impact), T1070 (Indicator Removal), T1021.002 (SMB/Windows Admin Shares)',
    '1. Network interface on NAS-02 administratively shutdown via core switch.\n2. svc-backup-sync account disabled in Active Directory.\n3. Verified air-gapped immutable AWS S3 Glacier snapshots remain uncompromised.',
    'Hardcoded plaintext credentials discovered in legacy backup maintenance script on decommissioned staging host.',
    NULL,
    NOW() - INTERVAL 1 DAY,
    NOW()
),
(
    3,
    'CS-2026-0003',
    'Automated Botnet Brute Force Against Public SSH Bastion',
    'Firewall detected >48,000 failed authentication attempts within 30 minutes targeting root and admin accounts.',
    'Distributed botnet nodes originating from known bulletproof hosting providers launched automated dictionary attacks against bastion-gw.corp.net on port 22. Fail2ban rules engaged, but volumetric spike caused intermittent gateway latency.',
    'Unauthorized Access',
    'Access Violation',
    'Medium',
    'P3 - Medium',
    'Resolved',
    3,
    3,
    'Edge Bastion GW-01 (IP 198.51.100.12)',
    'Perimeter Network',
    'Credential Access',
    'T1110.001 (Password Guessing), T1110.003 (Password Spraying)',
    '1. Immediate GeoIP block of offending ASN ranges.\n2. Disabled password authentication entirely in sshd_config.\n3. Enforced WireGuard VPN requirement prior to bastion reachability.',
    'Legacy configuration drift exposed SSH port directly to 0.0.0.0/0 following maintenance window.',
    'SSH access restricted to internal WireGuard VPN subnet only. Ed25519 hardware key authentication enforced company-wide. Bastion health stabilized.',
    NOW() - INTERVAL 4 DAY,
    NOW()
),
(
    4,
    'CS-2026-0004',
    'Suspicious Database Exfiltration Spike via Customer API',
    'Anomalous query pattern downloading 85,000 contact records via unthrottled API endpoint.',
    'CloudWatch anomaly detector flagged a 400% surge in egress traffic from the internal customer portal API. An external IP from Tor exit node was iterating through customer account IDs sequentially without triggering standard 429 rate limits.',
    'Data Breach',
    'Data Exfiltration',
    'Critical',
    'P1 - Critical',
    'In Triage',
    2,
    NULL,
    'Customer-DB-Primary (Port 3306), API Gateway Cluster',
    'Production',
    'Exfiltration, Collection',
    'T1530 (Data from Cloud Storage/Object), T1567 (Exfiltration Over Web Service)',
    '1. Revoked API authorization token utilized by the scraper.\n2. Injected WAF rule blocking all recognized Tor exit node IP addresses.\n3. Applied token-bucket rate limiter to customer enumeration route.',
    'Broken Object Level Authorization (BOLA) in newly deployed v2 customer directory endpoint.',
    NULL,
    NOW() - INTERVAL 6 HOUR,
    NOW()
),
(
    5,
    'CS-2026-0005',
    'Cryptomining Payload Discovered on Staging Kubernetes Node',
    'XMRig miner container running under kube-system namespace consuming 100% CPU.',
    'Datadog CPU threshold alerts on worker-node-k8s-07 triggered after sustained 100% utilization. Inspection revealed an anomalous container "coredns-cache-worker" pulling an image from public DockerHub repository with embedded XMRig configuration.',
    'Malware',
    'Cryptojacking',
    'High',
    'P2 - High',
    'Under Investigation',
    6,
    3,
    'k8s-worker-node-07, Staging Cluster VPC',
    'Staging',
    'Execution, Persistence, Resource Hijacking',
    'T1496 (Resource Hijacking), T1610 (Deploy Container)',
    '1. Drained and cordoned worker node.\n2. Terminated rogue pod and deleted malicious deployment manifest.\n3. Rotated Kubernetes service account tokens.',
    'Misconfigured kubelet API port 10250 with anonymous authentication enabled during testing.',
    NULL,
    NOW() - INTERVAL 18 HOUR,
    NOW()
)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 3. Insert Technical IOC Artifacts
INSERT INTO incident_artifacts (id, incident_id, artifact_type, artifact_value, threat_score, description, source_ref, created_at)
VALUES
(1, 1, 'IPv4', '198.51.100.23', 92, 'Adversary mail delivery source IP (Hostinger VPS in Romania)', 'publicly reported - CISA Alert AA24-110A', NOW() - INTERVAL 2 DAY),
(2, 1, 'Domain', 'secure-payro11-update.com', 98, 'Typosquatted domain mimicking payroll provider ADP', 'publicly reported - VirusTotal 14/88 detections', NOW() - INTERVAL 2 DAY),
(3, 1, 'SHA256', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 85, 'Malicious macro-enabled payload tax_update_q3.xlsm', 'publicly reported - Hybrid Analysis Sandbox', NOW() - INTERVAL 2 DAY),
(4, 2, 'File', 'RESTORE_README.txt', 100, 'Ransom payment instructions and Bitcoin wallet identifier', 'unconfirmed - Internal triage forensics', NOW() - INTERVAL 1 DAY),
(5, 2, 'IPv4', '203.0.113.88', 95, 'Command and Control (C2) server callback destination', 'publicly reported - AbuseIPDB blacklisted', NOW() - INTERVAL 1 DAY),
(6, 3, 'CIDR', '185.220.101.0/24', 80, 'Known Tor exit node cluster launching SSH attacks', 'publicly reported - Dan.me.uk Tor List', NOW() - INTERVAL 4 DAY),
(7, 4, 'IPv4', '194.26.29.112', 90, 'Scraper source IP extracting customer contact database', 'unconfirmed - Web server access log', NOW() - INTERVAL 6 HOUR)
ON DUPLICATE KEY UPDATE artifact_value=VALUES(artifact_value);

-- 4. Insert Timeline Events
INSERT INTO incident_timeline (id, incident_id, user_id, action, message, old_value, new_value, created_at)
VALUES
(1, 1, 4, 'INCIDENT_REPORTED', 'Incident submitted by reporter David Miller via web portal.', NULL, 'Reported', NOW() - INTERVAL 2 DAY),
(2, 1, 1, 'ANALYST_ASSIGNED', 'Security Admin Vikram Malhotra assigned incident to Lead Investigator Sarah Chen.', NULL, 'Assigned: Sarah Chen', NOW() - INTERVAL 46 HOUR),
(3, 1, 2, 'STATUS_TRANSITION', 'Status updated from Reported to Under Investigation following initial header analysis.', 'Reported', 'Under Investigation', NOW() - INTERVAL 44 HOUR),
(4, 1, 2, 'CONTAINMENT_ACTION', 'Domain secure-payro11-update.com sinkholed across enterprise DNS and firewall.', NULL, 'Sinkhole Activated', NOW() - INTERVAL 42 HOUR),
(5, 2, 1, 'INCIDENT_REPORTED', 'Critical canary alert triggered on NAS-02 backup repository.', NULL, 'Reported', NOW() - INTERVAL 24 HOUR),
(6, 2, 2, 'STATUS_TRANSITION', 'Network interface severed on NAS host. Threat contained.', 'In Triage', 'Contained', NOW() - INTERVAL 18 HOUR),
(7, 3, 3, 'STATUS_TRANSITION', 'Firewall rules tightened and SSH password auth disabled. Incident marked resolved.', 'Under Investigation', 'Resolved', NOW() - INTERVAL 12 HOUR)
ON DUPLICATE KEY UPDATE message=VALUES(message);

-- 5. Insert Analyst Comments
INSERT INTO incident_comments (id, incident_id, user_id, comment, is_internal, created_at)
VALUES
(1, 1, 2, 'Analyzed the email attachment in Any.Run sandbox. It contacts the Romanian C2 IP within 8 seconds of macro execution. Recommending company-wide inbox sweep.', 1, NOW() - INTERVAL 43 HOUR),
(2, 1, 1, 'Approved. Microsoft 365 sweep initiated. 14 identical messages quarantined automatically.', 1, NOW() - INTERVAL 42 HOUR),
(3, 2, 2, 'Air-gapped AWS Glacier backup verified intact as of 04:00 AM UTC. No lateral spread to hypervisor host observed.', 1, NOW() - INTERVAL 16 HOUR),
(4, 3, 3, 'Fail2ban threshold lowered to 3 failed attempts within 10 minutes. Cloudflare WAF rule deployed for edge protection.', 0, NOW() - INTERVAL 10 HOUR)
ON DUPLICATE KEY UPDATE comment=VALUES(comment);

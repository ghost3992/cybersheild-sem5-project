-- ====================================================================
-- CyberShield - Cybersecurity Incident Reporting & Tracking System
-- Full Stack-II Database Schema (MySQL 8.0+ / MariaDB)
-- ====================================================================

CREATE DATABASE IF NOT EXISTS cybershield_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cybershield_db;

-- 1. Users Table (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'analyst', 'employee') NOT NULL DEFAULT 'employee',
    department VARCHAR(100) NOT NULL DEFAULT 'IT / General',
    designation VARCHAR(100) DEFAULT 'Staff',
    phone VARCHAR(50) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tracking_id VARCHAR(30) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    summary TEXT NULL,
    description TEXT NOT NULL,
    incident_type VARCHAR(60) NOT NULL DEFAULT 'Other',
    category VARCHAR(60) NOT NULL DEFAULT 'Security Anomaly',
    severity ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    priority VARCHAR(30) NOT NULL DEFAULT 'P3 - Medium',
    status ENUM('Reported', 'In Triage', 'Under Investigation', 'Contained', 'Resolved', 'Closed') NOT NULL DEFAULT 'Reported',
    reporter_id INT NOT NULL,
    assigned_to INT NULL,
    impacted_assets VARCHAR(255) NULL,
    environment VARCHAR(50) DEFAULT 'Production',
    mitre_tactics VARCHAR(255) NULL,
    mitre_techniques VARCHAR(255) NULL,
    containment_plan TEXT NULL,
    root_cause TEXT NULL,
    resolution_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    triaged_at TIMESTAMP NULL DEFAULT NULL,
    contained_at TIMESTAMP NULL DEFAULT NULL,
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    closed_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_incident_tracking (tracking_id),
    INDEX idx_incident_status (status),
    INDEX idx_incident_severity (severity),
    INDEX idx_incident_reporter (reporter_id),
    INDEX idx_incident_assigned (assigned_to),
    INDEX idx_incident_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Incident Timeline / Lifecycle State Transitions
CREATE TABLE IF NOT EXISTS incident_timeline (
    id INT AUTO_INCREMENT PRIMARY KEY,
    incident_id INT NOT NULL,
    user_id INT NOT NULL,
    action VARCHAR(60) NOT NULL,
    message TEXT NOT NULL,
    old_value VARCHAR(100) NULL,
    new_value VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_timeline_incident (incident_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Incident Artifacts / Observables (IOCs)
CREATE TABLE IF NOT EXISTS incident_artifacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    incident_id INT NOT NULL,
    artifact_type VARCHAR(40) NOT NULL,
    artifact_value VARCHAR(255) NOT NULL,
    threat_score INT DEFAULT 50,
    description TEXT NULL,
    source_ref VARCHAR(255) DEFAULT 'unconfirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
    INDEX idx_artifact_incident (incident_id),
    INDEX idx_artifact_value (artifact_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Incident Comments & Analyst Discussion
CREATE TABLE IF NOT EXISTS incident_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    incident_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    is_internal TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_comment_incident (incident_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Audit Logs (Compliance & Enterprise Activity Logging)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(50) DEFAULT 'general',
    entity_id INT NULL,
    ip_address VARCHAR(60) DEFAULT '127.0.0.1',
    user_agent TEXT NULL,
    details TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

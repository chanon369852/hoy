-- Metrics and supporting tables for RGA Dashboard

-- 1) campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  provider ENUM('ga4','google_ads','meta','tiktok','shopify','other') NOT NULL,
  external_id VARCHAR(128),
  name VARCHAR(255) NOT NULL,
  status ENUM('active','paused','ended') DEFAULT 'active',
  currency VARCHAR(8) DEFAULT 'THB',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_campaign_client (client_id),
  INDEX idx_campaign_provider (provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) metrics_daily (aggregated per day)
CREATE TABLE IF NOT EXISTS metrics_daily (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  provider ENUM('ga4','google_ads','meta','tiktok','shopify','other') NOT NULL,
  campaign_id INT,
  date DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  cost DECIMAL(18,6) DEFAULT 0,
  conversions BIGINT DEFAULT 0,
  revenue DECIMAL(18,6) DEFAULT 0,
  ctr DECIMAL(10,6) GENERATED ALWAYS AS (CASE WHEN impressions>0 THEN clicks/impressions ELSE 0 END) VIRTUAL,
  cpm DECIMAL(10,6) GENERATED ALWAYS AS (CASE WHEN impressions>0 THEN (cost*1000)/impressions ELSE 0 END) VIRTUAL,
  cpc DECIMAL(10,6) GENERATED ALWAYS AS (CASE WHEN clicks>0 THEN cost/clicks ELSE 0 END) VIRTUAL,
  cpa DECIMAL(10,6) GENERATED ALWAYS AS (CASE WHEN conversions>0 THEN cost/conversions ELSE 0 END) VIRTUAL,
  roas DECIMAL(10,6) GENERATED ALWAYS AS (CASE WHEN cost>0 THEN revenue/cost ELSE 0 END) VIRTUAL,
  UNIQUE KEY uniq_client_provider_day (client_id, provider, campaign_id, date),
  INDEX idx_metrics_daily_client_date (client_id, date),
  INDEX idx_metrics_daily_campaign (campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) metrics_hourly (optional, near-realtime)
CREATE TABLE IF NOT EXISTS metrics_hourly (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  provider ENUM('ga4','google_ads','meta','tiktok','shopify','other') NOT NULL,
  campaign_id INT,
  ts DATETIME NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  cost DECIMAL(18,6) DEFAULT 0,
  conversions BIGINT DEFAULT 0,
  revenue DECIMAL(18,6) DEFAULT 0,
  INDEX idx_metrics_hourly_client_ts (client_id, ts),
  INDEX idx_metrics_hourly_campaign (campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) integrations (connection meta)
CREATE TABLE IF NOT EXISTS integrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  provider ENUM('ga4','google_ads','meta','tiktok','shopify','other') NOT NULL,
  auth_type ENUM('oauth','api_key') NOT NULL,
  credentials_encrypted TEXT,
  status ENUM('active','error','expired') DEFAULT 'active',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_integrations_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5) alerts
CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  dimension VARCHAR(64) DEFAULT 'global',
  condition_json JSON,
  status ENUM('active','resolved') DEFAULT 'active',
  triggered_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_alerts_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6) settings
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  refresh_interval_sec INT DEFAULT 300,
  kpi_targets_json JSON,
  thresholds_json JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_settings_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7) reports (saved report definitions)
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  params_json JSON,
  last_run_at TIMESTAMP NULL,
  schedule_cron VARCHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reports_client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8) audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  client_id INT,
  user_id INT,
  action VARCHAR(64),
  resource VARCHAR(64),
  meta_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_client_time (client_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed optional sample rows for a quick test
INSERT IGNORE INTO campaigns (id, client_id, provider, external_id, name)
VALUES (1, 1, 'google_ads', 'GA-001', 'Brand Search');

INSERT IGNORE INTO metrics_daily (client_id, provider, campaign_id, date, impressions, clicks, cost, conversions, revenue)
VALUES 
(1, 'google_ads', 1, CURDATE()-INTERVAL 6 DAY, 1000, 50, 200.00, 5, 600.00),
(1, 'google_ads', 1, CURDATE()-INTERVAL 5 DAY, 1200, 60, 220.00, 6, 700.00),
(1, 'google_ads', 1, CURDATE()-INTERVAL 4 DAY, 1100, 55, 210.00, 4, 500.00),
(1, 'google_ads', 1, CURDATE()-INTERVAL 3 DAY, 1500, 80, 260.00, 7, 800.00),
(1, 'google_ads', 1, CURDATE()-INTERVAL 2 DAY, 1800, 90, 300.00, 8, 900.00),
(1, 'google_ads', 1, CURDATE()-INTERVAL 1 DAY, 1700, 85, 290.00, 7, 850.00),
(1, 'google_ads', 1, CURDATE(), 1600, 82, 280.00, 6, 780.00);

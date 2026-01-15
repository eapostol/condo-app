-- Condo Reporting Database (MySQL/MariaDB)
-- Schema to support the demo reporting views + sample data.
-- NOTE: Foreign keys are intentionally omitted so TRUNCATE-based reset scripts work without FK restrictions.

USE condo_mgmt;

DROP TABLE IF EXISTS project_approval;
DROP TABLE IF EXISTS user_property_role;
DROP TABLE IF EXISTS project_file;
DROP TABLE IF EXISTS quote;
DROP TABLE IF EXISTS project;
DROP TABLE IF EXISTS file_attachment;
DROP TABLE IF EXISTS vendor;
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS property;
DROP TABLE IF EXISTS issue_type;
DROP TABLE IF EXISTS project_status;
DROP TABLE IF EXISTS project_category;
DROP TABLE IF EXISTS role;

CREATE TABLE role (
  role_id INT PRIMARY KEY,
  role_name VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE project_category (
  category_id INT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE project_status (
  status_id INT PRIMARY KEY,
  status_name VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE issue_type (
  issue_type_id INT PRIMARY KEY,
  issue_type_name VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE property (
  property_id INT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  corporation_number VARCHAR(100),
  address_line1 VARCHAR(255),
  city VARCHAR(150),
  province_state VARCHAR(150),
  postal_code VARCHAR(50),
  country VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE user (
  user_id INT PRIMARY KEY,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  is_active TINYINT NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE vendor (
  vendor_id INT PRIMARY KEY,
  vendor_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(200),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50)
) ENGINE=InnoDB;

CREATE TABLE file_attachment (
  file_id INT PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  uploaded_by INT NOT NULL,
  uploaded_at DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE project (
  project_id INT PRIMARY KEY,
  property_id INT NOT NULL,
  category_id INT NOT NULL,
  issue_type_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date_reported DATE,
  estimated_cost DECIMAL(12,2),
  status_id INT NOT NULL,
  action_required TEXT,
  manager_recommendation TEXT,
  created_by INT,
  approved_date DATE,
  completed_date DATE,
  planned_month INT,
  planned_week INT,
  selected_quote_id INT,
  selected_vendor_id INT,
  actual_cost DECIMAL(12,2)
) ENGINE=InnoDB;

CREATE TABLE quote (
  quote_id INT PRIMARY KEY,
  project_id INT NOT NULL,
  vendor_id INT NOT NULL,
  quote_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  details TEXT
) ENGINE=InnoDB;

CREATE TABLE project_file (
  project_file_id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  file_id INT NOT NULL,
  attachment_type VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE user_property_role (
  user_property_role_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  property_id INT NOT NULL,
  role_id INT NOT NULL,
  date_assigned DATE
) ENGINE=InnoDB;

CREATE TABLE project_approval (
  project_approval_id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  decision VARCHAR(50) NOT NULL,
  decision_date DATETIME NOT NULL,
  comments TEXT
) ENGINE=InnoDB;

-- Helpful indexes for the reporting queries/views
CREATE INDEX idx_project_property ON project(property_id);
CREATE INDEX idx_project_status ON project(status_id);
CREATE INDEX idx_quote_project ON quote(project_id);
CREATE INDEX idx_quote_vendor ON quote(vendor_id);
CREATE INDEX idx_upr_user ON user_property_role(user_id);
CREATE INDEX idx_upr_property ON user_property_role(property_id);
CREATE INDEX idx_pa_project ON project_approval(project_id);
CREATE INDEX idx_pa_user ON project_approval(user_id);

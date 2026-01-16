USE condo_mgmt;


-- ============================================================
-- Condo Management App - Reset to Baseline Sample Data
-- 
-- Purpose:
--   Reset the database back to the same baseline state as
--   defined in condo_mgmt_sample_data.sql, after you have
--   experimented with inserts/updates/deletes.
-- 
-- What it does:
--   1. Truncates transactional tables (removing existing data).
--   2. Re-inserts the same sample dataset.
-- 
-- NOTE:
--   This assumes the schema from condo_mgmt_schema.sql
--   has already been created.
-- ============================================================

USE condo_mgmt;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Truncate in dependency order (children first)
TRUNCATE TABLE project_approval;
TRUNCATE TABLE project_file;
TRUNCATE TABLE quote;
TRUNCATE TABLE user_property_role;
TRUNCATE TABLE project;
TRUNCATE TABLE file_attachment;
TRUNCATE TABLE vendor;
TRUNCATE TABLE issue_type;
TRUNCATE TABLE property;
TRUNCATE TABLE user;

SET FOREIGN_KEY_CHECKS = 1;

-- Re-insert the sample data exactly as in condo_mgmt_sample_data.sql

-- ============================================================
-- Condo Management App - Sample Data Insert Script
-- 
-- IMPORTANT:
-- - Run AFTER executing condo_mgmt_schema.sql.
-- - This script assumes the tables are empty (fresh database).
-- - It inserts a baseline demo dataset for two condo properties.
-- 
-- Purpose:
--   Give you realistic data so you can demo queries a condo
--   manager or board member might ask (open projects, quotes,
--   approvals, vendor performance, etc.).
-- ============================================================

USE condo_mgmt;

SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- Ensure lookup tables have expected baseline values
-- (idempotent thanks to ON DUPLICATE KEY)
-- ------------------------------------------------------------
INSERT INTO role (role_id, role_name) VALUES
  (1, 'Property Manager'),
  (2, 'Board Member'),
  (3, 'Resident'),
  (4, 'Vendor')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

INSERT INTO project_category (category_id, category_name) VALUES
  (1, 'Capital'),
  (2, 'Maintenance'),
  (3, 'Contract')
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);

INSERT INTO project_status (status_id, status_name) VALUES
  (1, 'Proposed'),
  (2, 'Pending Approval'),
  (3, 'Approved'),
  (4, 'In Progress'),
  (5, 'Deferred'),
  (6, 'Completed')
ON DUPLICATE KEY UPDATE status_name = VALUES(status_name);

-- ------------------------------------------------------------
-- ISSUE TYPES
-- 
-- These represent the "Issue Type" column from the spreadsheet
-- (e.g., HVAC, Plumbing, Roof, Waste Disposal, Elevator).
-- ------------------------------------------------------------
INSERT INTO issue_type (issue_type_id, issue_type_name) VALUES
  (1, 'Heating / Cooling (HVAC)'),
  (2, 'Plumbing'),
  (3, 'Roof'),
  (4, 'Waste Disposal'),
  (5, 'Elevator')
ON DUPLICATE KEY UPDATE issue_type_name = VALUES(issue_type_name);

-- ------------------------------------------------------------
-- PROPERTIES
-- 
-- Two sample condo corporations:
--   1) Maple Grove Condominiums
--   2) Lakeside Towers
-- ------------------------------------------------------------
INSERT INTO property
  (property_id, name, corporation_number, address_line1, city, province_state, postal_code, country)
VALUES
  (1, 'Maple Grove Condominiums', 'TSCC 1234', '100 Maple Grove Blvd', 'Toronto', 'Ontario', 'M1A 2B3', 'Canada'),
  (2, 'Lakeside Towers',          'TSCC 5678', '200 Lakeside Drive',   'Toronto', 'Ontario', 'M4C 5D6', 'Canada');

-- ------------------------------------------------------------
-- USERS
-- 
-- Alice = Property Manager
-- Bob & Carol = Board Members
-- David = Resident
-- Eva = Vendor contact (if you later wire users to vendors)
-- ------------------------------------------------------------
INSERT INTO user (user_id, full_name, email, password_hash, phone, is_active) VALUES
  (1, 'Alice Wong',  'alice.wong@maplegrove.example',  'hashed_pw_alice', '416-555-0101', 1),
  (2, 'Bob Chen',    'bob.chen@maplegrove.example',    'hashed_pw_bob',   '416-555-0102', 1),
  (3, 'Carol Smith', 'carol.smith@maplegrove.example', 'hashed_pw_carol', '416-555-0103', 1),
  (4, 'David Patel', 'david.patel@maplegrove.example', 'hashed_pw_david', '416-555-0104', 1),
  (5, 'Eva Lopez',   'eva.lopez@coolairhvac.example',  'hashed_pw_eva',   '416-555-0105', 1);

-- ------------------------------------------------------------
-- VENDORS
-- 
-- Several vendors representing typical condo service providers.
-- ------------------------------------------------------------
INSERT INTO vendor (vendor_id, vendor_name, contact_name, contact_email, contact_phone) VALUES
  (1, 'CoolAir Heating & Cooling',         'Eva Lopez',   'service@coolairhvac.example',      '416-555-0201'),
  (2, 'TopNotch Plumbing Inc.',           'Mark Davis',  'info@topnotchplumbing.example',    '416-555-0202'),
  (3, 'Skyline Roofing Ltd.',             'Priya Singh', 'estimates@skylineroofing.example', '416-555-0203'),
  (4, 'LiftWorks Elevator Services',      'John Evans',  'sales@liftworks.example',          '416-555-0204'),
  (5, 'FreshClean Environmental Services', 'Sarah Lee',  'quotes@freshclean.example',        '416-555-0205'),
  (6, 'Evergreen Roofing & Waterproofing', 'Tom Brown',  'info@evergreenroof.example',       '416-555-0206'),
  (7, 'MetroLift Elevator Corp.',         'Linda Green', 'sales@metrolift.example',          '416-555-0207');

-- ------------------------------------------------------------
-- FILE ATTACHMENTS
-- 
-- These represent documents stored externally (S3, file server)
-- and referenced here only by relative path.
-- ------------------------------------------------------------
INSERT INTO file_attachment (file_id, file_name, file_path, file_type, uploaded_by, uploaded_at) VALUES
  (1, 'roof_condition_report.pdf',        'files/roof_condition_report.pdf',        'PDF', 1, '2025-02-12 09:00:00'),
  (2, 'booster_pump_quote_topnotch.pdf',  'files/booster_pump_quote_topnotch.pdf',  'PDF', 1, '2024-12-02 10:30:00'),
  (3, 'elevator_contract_draft_2025.pdf', 'files/elevator_contract_draft_2025.pdf', 'PDF', 1, '2025-01-22 11:15:00');

-- ------------------------------------------------------------
-- PROJECTS
-- 
-- These rows model the Management Report + Annual Planning
-- Guide use cases:
--   - capital project (roof)
--   - recurring maintenance (HVAC, garbage chutes)
--   - contract renewal (elevator)
--   - completed capital job (booster pump)
-- ------------------------------------------------------------
INSERT INTO project
  (project_id, property_id, category_id, issue_type_id,
   title, description, date_reported, estimated_cost,
   status_id, action_required, manager_recommendation,
   created_by, approved_date, completed_date,
   planned_month, planned_week,
   selected_quote_id, selected_vendor_id, actual_cost)
VALUES
  -- Project 1: Annual HVAC maintenance (Maple Grove, recurring maintenance)
  (1, 1, 2, 1,
   'Annual Boiler Inspection and HVAC Maintenance',
   'Annual inspection and tune-up of boilers and HVAC system for all common areas. Required before peak winter heating season.',
   '2025-01-05', 1500.00,
   4, -- In Progress
   'Complete annual boiler and HVAC inspection before February 1. Coordinate access to mechanical rooms.',
   'Proceed with scheduled maintenance using existing vendor CoolAir Heating & Cooling.',
   1, NULL, NULL,
   1, 2,    -- January, 2nd week
   NULL, 1, NULL),

  -- Project 2: Roof membrane replacement (Capital project needing board approval)
  (2, 1, 1, 3,
   'Roof Membrane Replacement - Tower A',
   'Existing roof membrane is near end-of-life with multiple patches and signs of ponding water. Full replacement recommended to prevent leaks.',
   '2025-02-10', 85000.00,
   2, -- Pending Approval
   'Board to review vendor quotes and approve a vendor for full roof membrane replacement.',
   'Recommend Skyline Roofing Ltd. based on lowest qualified bid and strong references from neighboring buildings.',
   1, NULL, NULL,
   7, 3,    -- July, 3rd week (example annual plan scheduling)
   NULL, NULL, NULL),

  -- Project 3: Garbage chute deep cleaning (Maintenance, completed)
  (3, 1, 2, 4,
   'Garbage Chute Cleaning and Deodorizing - All Floors',
   'Residents have reported persistent odors from garbage chutes. Quarterly deep cleaning and deodorizing is recommended.',
   '2025-03-01', 2000.00,
   6, -- Completed
   'Set reminder for quarterly cleaning schedule and communicate to residents once each cycle is completed.',
   'Completed by FreshClean Environmental Services; feedback from residents has been positive so far.',
   1, '2025-02-15', '2025-03-10',
   3, 1,    -- March, 1st week
   NULL, 5, 1900.00),

  -- Project 4: Elevator maintenance contract renewal (Contract, Lakeside)
  (4, 2, 3, 5,
   'Elevator Maintenance Contract Renewal',
   'Renew annual maintenance contract for all passenger elevators, including 24/7 emergency response coverage.',
   '2025-01-20', 12000.00,
   3, -- Approved
   'Legal review and board sign-off on 3-year contract term before renewal date.',
   'Approve LiftWorks Elevator Services for a 3-year term based on service history and competitive pricing.',
   1, '2025-02-01', NULL,
   2, 1,    -- February, 1st week
   NULL, 4, NULL),

  -- Project 5: Booster pump replacement (Capital, completed, with variance)
  (5, 1, 1, 2,
   'Booster Pump Replacement - Domestic Water',
   'Domestic water booster pump has reached end-of-life and has had multiple breakdowns over the last year.',
   '2024-11-15', 25000.00,
   6, -- Completed
   'No further action required; keep documentation for future audit and life-cycle planning.',
   'Project successfully completed by TopNotch Plumbing Inc.; water pressure issues resolved.',
   1, '2025-01-05', '2025-02-20',
   NULL, NULL,
   NULL, 2, 26000.00);

-- ------------------------------------------------------------
-- QUOTES (Vendor bids per project)
-- 
-- Used to demonstrate:
--   - historical cost comparisons
--   - lowest bid vs selected vendor
-- ------------------------------------------------------------
INSERT INTO quote
  (quote_id, project_id, vendor_id, quote_date, amount, details)
VALUES
  -- Quotes for Project 2 (Roof Membrane Replacement)
  (1, 2, 3, '2025-02-15', 82000.00,
   'Full roof membrane replacement including tear-off, new insulation, and 20-year warranty.'),
  (2, 2, 6, '2025-02-16', 87000.00,
   'Roof replacement with upgraded insulation; includes 25-year warranty and 2-year maintenance.'),

  -- Quotes for Project 4 (Elevator Contract Renewal)
  (3, 4, 4, '2025-01-25', 11500.00,
   'Annual maintenance contract including 24/7 emergency service and quarterly inspections.'),
  (4, 4, 7, '2025-01-26', 12500.00,
   'Annual maintenance contract with extended response-time guarantees and remote monitoring.'),

  -- Quotes for Project 5 (Booster Pump Replacement)
  (5, 5, 2, '2024-12-01', 24500.00,
   'Replacement of booster pump including labor, commissioning, and disposal of old equipment.'),
  (6, 5, 1, '2024-12-02', 27000.00,
   'Booster pump replacement with extended warranty and full HVAC system inspection.'),

  -- Quote for Project 3 (Garbage Chute Cleaning)
  (7, 3, 5, '2025-02-20', 2000.00,
   'Deep cleaning and deodorizing of all garbage chutes and compactor rooms.');

-- Mark selected quotes for specific projects (simulating board decision)
UPDATE project SET selected_quote_id = 1 WHERE project_id = 2; -- roof
UPDATE project SET selected_quote_id = 7 WHERE project_id = 3; -- garbage chutes
UPDATE project SET selected_quote_id = 3 WHERE project_id = 4; -- elevator
UPDATE project SET selected_quote_id = 5 WHERE project_id = 5; -- booster pump

-- ------------------------------------------------------------
-- PROJECT FILES (Attachments linked to projects)
-- 
-- These represent the "Supporting Files (Attachment)" concept
-- from the spreadsheet (reports, quotes, contracts).
-- ------------------------------------------------------------
INSERT INTO project_file (project_id, file_id, attachment_type) VALUES
  (2, 1, 'Engineer Roof Condition Report'),
  (5, 2, 'Vendor Quote - Selected'),
  (4, 3, 'Draft Contract for Board Review');

-- ------------------------------------------------------------
-- USER-PROPERTY-ROLE
-- 
-- Assigns users to roles on specific properties.
-- ------------------------------------------------------------
INSERT INTO user_property_role (user_id, property_id, role_id, date_assigned) VALUES
  -- Alice: Property Manager for both properties
  (1, 1, 1, '2024-01-01'),
  (1, 2, 1, '2024-01-01'),

  -- Bob & Carol: Board Members for Maple Grove
  (2, 1, 2, '2024-01-15'),
  (3, 1, 2, '2024-01-15'),

  -- David: Resident at Maple Grove
  (4, 1, 3, '2024-02-01'),

  -- Eva: Vendor role for Maple Grove (if vendor login is enabled)
  (5, 1, 4, '2024-03-01');

-- ------------------------------------------------------------
-- PROJECT APPROVALS (Board decisions)
-- 
-- Used to demo:
--   - multi-approver workflows
--   - "who voted how and when" questions
-- ------------------------------------------------------------
INSERT INTO project_approval
  (project_id, user_id, decision, decision_date, comments)
VALUES
  -- Booster Pump Replacement (Project 5) - Approved by both board members
  (5, 2, 'Approved',  '2025-01-03', 'Urgent reliability issue; approve before peak winter season.'),
  (5, 3, 'Approved',  '2025-01-04', 'Supports manager recommendation; cost is reasonable.'),

  -- Elevator Contract Renewal (Project 4) - Approved by both board members
  (4, 2, 'Approved',  '2025-01-28', 'LiftWorks has performed well over last term; renewal is justified.'),
  (4, 3, 'Approved',  '2025-01-29', 'Prefers 3-year term for better pricing stability.'),

  -- Roof Membrane Replacement (Project 2) - Mixed initial responses
  (2, 2, 'Approved',  '2025-02-20', 'Roof is critical; delaying may increase long-term costs.'),
  (2, 3, 'Abstained', '2025-02-20', 'Requests further information on alternative financing options.');

-- ============================================================
-- END OF SAMPLE DATA
-- ============================================================

-- End of reset baseline script

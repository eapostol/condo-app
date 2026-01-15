
-- ============================================================
-- Condo Management App - Views for Manager/Board-Friendly Queries
-- 
-- Purpose:
--   Wrap commonly-used multi-join queries into named views so
--   property managers and board members can run simple:
--     SELECT * FROM view_name WHERE ...
--   without remembering the join logic.
-- 
-- Prerequisites:
--   - Run condo_mgmt_schema.sql to create the schema.
--   - Optionally run condo_mgmt_sample_data.sql to load demo data.
-- 
-- Usage examples are included in comments above each view.
-- ============================================================

USE condo_mgmt;

SET NAMES utf8mb4;

-- For idempotency during development:
DROP VIEW IF EXISTS vw_pending_approvals_by_user;
DROP VIEW IF EXISTS vw_completed_maintenance_projects;
DROP VIEW IF EXISTS vw_completed_capital_projects_variance;
DROP VIEW IF EXISTS vw_vendor_performance_summary;
DROP VIEW IF EXISTS vw_project_approval_history;
DROP VIEW IF EXISTS vw_pending_board_approval_projects;
DROP VIEW IF EXISTS vw_planned_maintenance_tasks;
DROP VIEW IF EXISTS vw_open_projects;

-- ------------------------------------------------------------
-- vw_open_projects
-- 
-- Question it answers:
--   "Show me all projects that are not completed or deferred,
--    with their type, status, estimated cost, and when they
--    were reported."
-- 
-- Example usage:
--   -- All open projects for Maple Grove
--   SELECT * FROM vw_open_projects
--   WHERE property_name = 'Maple Grove Condominiums';
-- ------------------------------------------------------------
CREATE VIEW vw_open_projects AS
SELECT
  prop.property_id,
  prop.name              AS property_name,
  p.project_id,
  p.title,
  pc.category_name       AS category,
  it.issue_type_name     AS issue_type,
  ps.status_name         AS status,
  p.estimated_cost,
  p.planned_month,
  p.planned_week,
  p.date_reported
FROM project p
JOIN property prop          ON p.property_id = prop.property_id
JOIN project_status ps      ON p.status_id = ps.status_id
JOIN project_category pc    ON p.category_id = pc.category_id
LEFT JOIN issue_type it     ON p.issue_type_id = it.issue_type_id
WHERE ps.status_name NOT IN ('Completed', 'Deferred');

-- ------------------------------------------------------------
-- vw_planned_maintenance_tasks
-- 
-- Question it answers:
--   "From our annual plan, what maintenance tasks are planned
--    (have a planned month/week), and what is their status?"
-- 
-- Example usage:
--   -- Planned maintenance for Maple Grove
--   SELECT * FROM vw_planned_maintenance_tasks
--   WHERE property_name = 'Maple Grove Condominiums'
--   ORDER BY planned_month, planned_week;
-- ------------------------------------------------------------
CREATE VIEW vw_planned_maintenance_tasks AS
SELECT
  prop.property_id,
  prop.name              AS property_name,
  p.project_id,
  p.title,
  pc.category_name       AS category,
  it.issue_type_name     AS issue_type,
  p.planned_month,
  p.planned_week,
  ps.status_name         AS status
FROM project p
JOIN property prop       ON p.property_id = prop.property_id
JOIN project_category pc ON p.category_id = pc.category_id
JOIN project_status ps   ON p.status_id = ps.status_id
LEFT JOIN issue_type it  ON p.issue_type_id = it.issue_type_id
WHERE pc.category_name = 'Maintenance'
  AND p.planned_month IS NOT NULL;

-- ------------------------------------------------------------
-- vw_pending_board_approval_projects
-- 
-- Question it answers:
--   "Which projects are currently pending board approval,
--    what are their lowest quotes, and what is the manager
--    recommending?"
-- 
-- Example usage:
--   -- Pending approvals for all properties
--   SELECT * FROM vw_pending_board_approval_projects;
--
--   -- Pending approvals just for Maple Grove
--   SELECT * FROM vw_pending_board_approval_projects
--   WHERE property_name = 'Maple Grove Condominiums';
-- ------------------------------------------------------------
CREATE VIEW vw_pending_board_approval_projects AS
SELECT
  prop.property_id,
  prop.name                 AS property_name,
  p.project_id,
  p.title,
  p.description,
  p.estimated_cost,
  MIN(q.amount)             AS lowest_quote_amount,
  COUNT(q.quote_id)         AS number_of_quotes,
  p.manager_recommendation
FROM project p
JOIN property prop      ON p.property_id = prop.property_id
JOIN project_status ps  ON p.status_id = ps.status_id
LEFT JOIN quote q       ON q.project_id = p.project_id
WHERE ps.status_name = 'Pending Approval'
GROUP BY
  prop.property_id,
  prop.name,
  p.project_id,
  p.title,
  p.description,
  p.estimated_cost,
  p.manager_recommendation;

-- ------------------------------------------------------------
-- vw_project_approval_history
-- 
-- Question it answers:
--   "For any project, which board members voted, what did they
--    decide, and when?"
-- 
-- Example usage:
--   -- Full approval history for project_id = 2
--   SELECT * FROM vw_project_approval_history
--   WHERE project_id = 2
--   ORDER BY decision_date, board_member;
-- ------------------------------------------------------------
CREATE VIEW vw_project_approval_history AS
SELECT
  prop.property_id,
  prop.name          AS property_name,
  p.project_id,
  p.title            AS project_title,
  u.user_id          AS board_member_id,
  u.full_name        AS board_member,
  pa.decision,
  pa.decision_date,
  pa.comments
FROM project_approval pa
JOIN project p   ON pa.project_id = p.project_id
JOIN property prop ON p.property_id = prop.property_id
JOIN user u      ON pa.user_id    = u.user_id;

-- ------------------------------------------------------------
-- vw_vendor_performance_summary
-- 
-- Question it answers:
--   "For each vendor, how many projects have we selected them
--    for, and how much have we spent in total?"
-- 
-- Example usage:
--   SELECT * FROM vw_vendor_performance_summary
--   ORDER BY selected_projects_count DESC;
-- ------------------------------------------------------------
CREATE VIEW vw_vendor_performance_summary AS
SELECT
  v.vendor_id,
  v.vendor_name,
  COUNT(p.project_id)                AS selected_projects_count,
  SUM(p.actual_cost)                 AS total_actual_spend,
  MIN(p.actual_cost)                 AS min_actual_spend,
  MAX(p.actual_cost)                 AS max_actual_spend
FROM vendor v
LEFT JOIN project p
  ON p.selected_vendor_id = v.vendor_id
GROUP BY v.vendor_id, v.vendor_name;

-- ------------------------------------------------------------
-- vw_completed_capital_projects_variance
-- 
-- Question it answers:
--   "For completed capital projects, how did the actual cost
--    compare to the original estimate and the selected quote?"
-- 
-- Example usage:
--   -- All completed capital projects, any property
--   SELECT * FROM vw_completed_capital_projects_variance;
--
--   -- Just Maple Grove
--   SELECT * FROM vw_completed_capital_projects_variance
--   WHERE property_name = 'Maple Grove Condominiums';
-- ------------------------------------------------------------
CREATE VIEW vw_completed_capital_projects_variance AS
SELECT
  prop.property_id,
  prop.name                 AS property_name,
  p.project_id,
  p.title,
  pc.category_name          AS category,
  p.estimated_cost,
  sq.amount                 AS selected_quote_amount,
  p.actual_cost,
  (p.actual_cost - p.estimated_cost) AS variance_vs_estimate,
  (p.actual_cost - sq.amount)        AS variance_vs_quote
FROM project p
JOIN property prop        ON p.property_id = prop.property_id
JOIN project_category pc  ON p.category_id = pc.category_id
JOIN project_status ps    ON p.status_id = ps.status_id
LEFT JOIN quote sq        ON sq.quote_id = p.selected_quote_id
WHERE pc.category_name = 'Capital'
  AND ps.status_name = 'Completed';

-- ------------------------------------------------------------
-- vw_completed_maintenance_projects
-- 
-- Question it answers:
--   "What maintenance jobs have we completed, when were they
--    completed, and what did they cost?"
-- 
-- Example usage:
--   -- Completed maintenance for Maple Grove
--   SELECT * FROM vw_completed_maintenance_projects
--   WHERE property_name = 'Maple Grove Condominiums'
--   ORDER BY completed_date DESC;
-- ------------------------------------------------------------
CREATE VIEW vw_completed_maintenance_projects AS
SELECT
  prop.property_id,
  prop.name              AS property_name,
  p.project_id,
  p.title,
  it.issue_type_name     AS issue_type,
  p.completed_date,
  p.actual_cost
FROM project p
JOIN property prop       ON p.property_id = prop.property_id
JOIN project_category pc ON p.category_id = pc.category_id
JOIN project_status ps   ON p.status_id = ps.status_id
LEFT JOIN issue_type it  ON p.issue_type_id = it.issue_type_id
WHERE pc.category_name = 'Maintenance'
  AND ps.status_name = 'Completed'
  AND p.completed_date IS NOT NULL;

-- ------------------------------------------------------------
-- vw_pending_approvals_by_user
-- 
-- Question it answers:
--   "For each board member, which projects are currently in
--    'Pending Approval' state where they have NOT yet recorded
--    a decision?"
-- 
-- Example usage:
--   -- Pending approvals for board member 'Bob Chen'
--   SELECT *
--   FROM vw_pending_approvals_by_user
--   WHERE board_member = 'Bob Chen'
--   ORDER BY project_id;
-- 
--   -- If you prefer by user_id:
--   SELECT *
--   FROM vw_pending_approvals_by_user
--   WHERE board_member_id = 2;
-- ------------------------------------------------------------
CREATE VIEW vw_pending_approvals_by_user AS
SELECT
  u.user_id           AS board_member_id,
  u.full_name         AS board_member,
  prop.property_id,
  prop.name           AS property_name,
  p.project_id,
  p.title,
  ps.status_name      AS status,
  p.estimated_cost,
  MIN(q.amount)       AS lowest_quote_amount
FROM project p
JOIN property prop      ON p.property_id = prop.property_id
JOIN project_status ps  ON p.status_id = ps.status_id
LEFT JOIN quote q       ON q.project_id = p.project_id
-- Identify board members for each property
JOIN user_property_role upr
  ON upr.property_id = p.property_id
 AND upr.role_id = 2   -- 2 = Board Member
JOIN user u
  ON u.user_id = upr.user_id
-- Left join existing approvals for that user/project
LEFT JOIN project_approval pa
  ON pa.project_id = p.project_id
 AND pa.user_id = u.user_id
WHERE ps.status_name = 'Pending Approval'
  AND pa.project_id IS NULL  -- i.e., this board member has not voted yet
GROUP BY
  u.user_id,
  u.full_name,
  prop.property_id,
  prop.name,
  p.project_id,
  p.title,
  ps.status_name,
  p.estimated_cost;

-- ============================================================
-- END OF VIEWS SCRIPT
-- ============================================================

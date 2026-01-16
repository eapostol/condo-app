
-- ============================================================
-- Condo Management App - Role-Oriented Views
-- 
-- Purpose:
--   Provide a SECOND set of views that are oriented around
--   who is consuming the data:
--     - Manager-facing views (operational detail)
--     - Board-facing views (governance & approvals)
--
-- These do NOT enforce security or roles by themselves;
-- application logic should control which views each user can
-- access. The goal is to give each audience simplified,
-- business-readable SELECT entry points.
-- 
-- Prerequisites:
--   - condo_mgmt_schema.sql (schema created)
--   - Optional: condo_mgmt_sample_data.sql (demo data)
-- ============================================================

USE condo_mgmt;

SET NAMES utf8mb4;

-- For idempotent re-runs, drop these views if they exist.
DROP VIEW IF EXISTS vw_board_capital_spend_summary_ytd;
DROP VIEW IF EXISTS vw_board_member_pending_approvals;
DROP VIEW IF EXISTS vw_board_pending_approvals_summary;
DROP VIEW IF EXISTS vw_manager_property_summary;
DROP VIEW IF EXISTS vw_manager_vendor_quotes_detail;
DROP VIEW IF EXISTS vw_manager_open_projects_detailed;

-- ============================================================
-- MANAGER-FACING VIEWS
-- ============================================================

-- ------------------------------------------------------------
-- vw_manager_open_projects_detailed
-- 
-- Question it answers (Manager):
--   "Show me all open projects (not completed/deferred) with
--    full operational detail, including selected vendor and
--    any selected quote."
--
-- Typical usage:
--   SELECT *
--   FROM vw_manager_open_projects_detailed
--   WHERE property_name = 'Maple Grove Condominiums'
--   ORDER BY date_reported;
-- ------------------------------------------------------------
CREATE VIEW vw_manager_open_projects_detailed AS
SELECT
  prop.property_id,
  prop.name                AS property_name,
  p.project_id,
  p.title,
  pc.category_name         AS category,
  it.issue_type_name       AS issue_type,
  ps.status_name           AS status,
  p.estimated_cost,
  p.actual_cost,
  (p.actual_cost - p.estimated_cost)         AS variance_estimate_vs_actual,
  p.planned_month,
  p.planned_week,
  p.date_reported,
  v.vendor_id              AS selected_vendor_id,
  v.vendor_name            AS selected_vendor_name,
  sq.quote_id              AS selected_quote_id,
  sq.amount                AS selected_quote_amount
FROM project p
JOIN property prop           ON p.property_id = prop.property_id
JOIN project_status ps       ON p.status_id   = ps.status_id
JOIN project_category pc     ON p.category_id = pc.category_id
LEFT JOIN issue_type it      ON p.issue_type_id = it.issue_type_id
LEFT JOIN vendor v           ON p.selected_vendor_id = v.vendor_id
LEFT JOIN quote sq           ON p.selected_quote_id  = sq.quote_id
WHERE ps.status_name NOT IN ('Completed', 'Deferred');


-- ------------------------------------------------------------
-- vw_manager_vendor_quotes_detail
-- 
-- Question it answers (Manager):
--   "For each project, show all vendor quotes with amounts,
--    and clearly indicate which quote (if any) was selected."
--
-- Typical usage:
--   -- All quotes for Maple Grove projects
--   SELECT *
--   FROM vw_manager_vendor_quotes_detail
--   WHERE property_name = 'Maple Grove Condominiums'
--   ORDER BY project_id, quote_amount;
-- ------------------------------------------------------------
CREATE VIEW vw_manager_vendor_quotes_detail AS
SELECT
  prop.property_id,
  prop.name            AS property_name,
  p.project_id,
  p.title              AS project_title,
  ps.status_name       AS project_status,
  v.vendor_id,
  v.vendor_name,
  q.quote_id,
  q.amount             AS quote_amount,
  q.quote_date,
  q.details            AS quote_details,
  CASE
    WHEN q.quote_id = p.selected_quote_id THEN 1
    ELSE 0
  END                  AS is_selected_quote
FROM quote q
JOIN project p         ON q.project_id = p.project_id
JOIN property prop     ON p.property_id = prop.property_id
JOIN project_status ps ON p.status_id = ps.status_id
JOIN vendor v          ON q.vendor_id  = v.vendor_id;


-- ------------------------------------------------------------
-- vw_manager_property_summary
-- 
-- Question it answers (Manager):
--   "Give me a quick summary per property: how many total
--    projects, how many are open, pending approval, completed,
--    and what are the total estimated vs actual costs?"
--
-- Typical usage:
--   SELECT * FROM vw_manager_property_summary;
-- ------------------------------------------------------------
CREATE VIEW vw_manager_property_summary AS
SELECT
  prop.property_id,
  prop.name AS property_name,
  COUNT(p.project_id) AS total_projects,
  SUM(CASE
        WHEN ps.status_name NOT IN ('Completed','Deferred')
        THEN 1 ELSE 0
      END) AS open_projects,
  SUM(CASE
        WHEN ps.status_name = 'Pending Approval'
        THEN 1 ELSE 0
      END) AS pending_approval_projects,
  SUM(CASE
        WHEN ps.status_name IN ('Approved','In Progress')
        THEN 1 ELSE 0
      END) AS approved_or_in_progress_projects,
  SUM(CASE
        WHEN ps.status_name = 'Completed'
        THEN 1 ELSE 0
      END) AS completed_projects,
  SUM(p.estimated_cost) AS total_estimated_cost,
  SUM(p.actual_cost)    AS total_actual_cost
FROM property prop
LEFT JOIN project p        ON p.property_id = prop.property_id
LEFT JOIN project_status ps ON p.status_id = ps.status_id
GROUP BY prop.property_id, prop.name;


-- ============================================================
-- BOARD-FACING VIEWS
-- ============================================================

-- ------------------------------------------------------------
-- vw_board_pending_approvals_summary
-- 
-- Question it answers (Board):
--   "For each property, which projects are currently in
--    'Pending Approval', what are their lowest quotes,
--    and what is the manager recommending?"
--
-- Typical usage:
--   SELECT *
--   FROM vw_board_pending_approvals_summary
--   WHERE property_name = 'Maple Grove Condominiums'
--   ORDER BY project_id;
-- ------------------------------------------------------------
CREATE VIEW vw_board_pending_approvals_summary AS
SELECT
  prop.property_id,
  prop.name                 AS property_name,
  p.project_id,
  p.title,
  pc.category_name          AS category,
  it.issue_type_name        AS issue_type,
  p.date_reported,
  p.estimated_cost,
  MIN(q.amount)             AS lowest_quote_amount,
  COUNT(q.quote_id)         AS number_of_quotes,
  p.manager_recommendation
FROM project p
JOIN property prop      ON p.property_id = prop.property_id
JOIN project_status ps  ON p.status_id   = ps.status_id
JOIN project_category pc ON p.category_id = pc.category_id
LEFT JOIN issue_type it ON p.issue_type_id = it.issue_type_id
LEFT JOIN quote q       ON q.project_id = p.project_id
WHERE ps.status_name = 'Pending Approval'
GROUP BY
  prop.property_id,
  prop.name,
  p.project_id,
  p.title,
  pc.category_name,
  it.issue_type_name,
  p.date_reported,
  p.estimated_cost,
  p.manager_recommendation;


-- ------------------------------------------------------------
-- vw_board_member_pending_approvals
-- 
-- Question it answers (Board):
--   "For each board member, which 'Pending Approval' projects
--    still require THEIR vote?"
--
-- Logic:
--   - Start from projects in 'Pending Approval'
--   - Determine board members for the same property
--   - Exclude projects where that board member already has
--     a row in project_approval (i.e., has voted).
--
-- Typical usage:
--   -- Bob Chen's to-do list:
--   SELECT *
--   FROM vw_board_member_pending_approvals
--   WHERE board_member = 'Bob Chen'
--   ORDER BY property_name, project_id;
-- ------------------------------------------------------------
CREATE VIEW vw_board_member_pending_approvals AS
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
JOIN project_status ps  ON p.status_id   = ps.status_id
LEFT JOIN quote q       ON q.project_id  = p.project_id
-- Identify board members for each property
JOIN user_property_role upr
  ON upr.property_id = p.property_id
 AND upr.role_id = 2   -- 2 = Board Member
JOIN user u
  ON u.user_id = upr.user_id
-- Left join existing approvals for that user/project
LEFT JOIN project_approval pa
  ON pa.project_id = p.project_id
 AND pa.user_id    = u.user_id
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


-- ------------------------------------------------------------
-- vw_board_capital_spend_summary_ytd
-- 
-- Question it answers (Board):
--   "For the current calendar year, what does our capital
--    project pipeline and spend look like by property?"
--
-- Definitions (current year = YEAR(CURDATE())):
--   total_capital_estimated_current_year:
--     Sum of estimated costs for capital projects whose
--     approved_date (or reported date as fallback) is in
--     the current year AND whose status is Approved,
--     In Progress, or Completed.
--
--   total_capital_actual_spend_current_year:
--     Sum of actual_cost for capital projects that are
--     Completed with completed_date in the current year.
--
--   approved_capital_projects_current_year:
--     Count of capital projects with status Approved and
--     approved_date in the current year.
--
--   completed_capital_projects_current_year:
--     Count of capital projects with status Completed and
--     completed_date in the current year.
--
-- Typical usage:
--   SELECT *
--   FROM vw_board_capital_spend_summary_ytd
--   ORDER BY property_name;
-- ------------------------------------------------------------
CREATE VIEW vw_board_capital_spend_summary_ytd AS
SELECT
  prop.property_id,
  prop.name AS property_name,
  -- Sum of estimated capital cost for this year (pipeline)
  SUM(
    CASE
      WHEN pc.category_name = 'Capital'
       AND ps.status_name IN ('Approved','In Progress','Completed')
       AND YEAR(COALESCE(p.approved_date, p.date_reported)) = YEAR(CURDATE())
      THEN p.estimated_cost
      ELSE 0
    END
  ) AS total_capital_estimated_current_year,
  -- Actual spend YTD on completed capital projects
  SUM(
    CASE
      WHEN pc.category_name = 'Capital'
       AND ps.status_name = 'Completed'
       AND p.completed_date IS NOT NULL
       AND YEAR(p.completed_date) = YEAR(CURDATE())
      THEN p.actual_cost
      ELSE 0
    END
  ) AS total_capital_actual_spend_current_year,
  -- Number of capital projects approved this year
  SUM(
    CASE
      WHEN pc.category_name = 'Capital'
       AND ps.status_name = 'Approved'
       AND p.approved_date IS NOT NULL
       AND YEAR(p.approved_date) = YEAR(CURDATE())
      THEN 1
      ELSE 0
    END
  ) AS approved_capital_projects_current_year,
  -- Number of capital projects completed this year
  SUM(
    CASE
      WHEN pc.category_name = 'Capital'
       AND ps.status_name = 'Completed'
       AND p.completed_date IS NOT NULL
       AND YEAR(p.completed_date) = YEAR(CURDATE())
      THEN 1
      ELSE 0
    END
  ) AS completed_capital_projects_current_year
FROM property prop
LEFT JOIN project p
  ON p.property_id = prop.property_id
LEFT JOIN project_category pc
  ON p.category_id = pc.category_id
LEFT JOIN project_status ps
  ON p.status_id = ps.status_id
GROUP BY prop.property_id, prop.name;

-- ============================================================
-- END OF ROLE-ORIENTED VIEWS SCRIPT
-- ============================================================

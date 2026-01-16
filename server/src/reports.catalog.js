/**
 * Reporting catalog
 * - id is used by the API: /api/reports/:id
 * - roles controls who can access the report (admin always allowed)
 * - mysqlView is the SQL view to query when REPORTING_PROVIDER=mysql
 *
 * Add mongoAggregationId later when REPORTING_PROVIDER=mongo.
 */
export const REPORT_CATALOG = [
  // Manager-facing (detailed operational reports)
  {
    id: 'manager_open_projects_detailed',
    roles: ['manager', 'admin'],
    title: 'Open Projects (Detailed)',
    mysqlView: 'vw_manager_open_projects_detailed',
    filters: ['property_id']
  },
  {
    id: 'manager_vendor_quotes_detail',
    roles: ['manager', 'admin'],
    title: 'Vendor Quotes (Detail)',
    mysqlView: 'vw_manager_vendor_quotes_detail',
    filters: ['project_id', 'property_id']
  },
  {
    id: 'manager_property_summary',
    roles: ['manager', 'admin'],
    title: 'Property Summary (YTD)',
    mysqlView: 'vw_manager_property_summary',
    filters: ['property_id']
  },

  // Board-facing
  {
    id: 'board_pending_approvals_summary',
    roles: ['board', 'admin'],
    title: 'Pending Approvals Summary',
    mysqlView: 'vw_board_pending_approvals_summary',
    filters: ['property_id']
  },
  {
    id: 'board_member_pending_approvals',
    roles: ['board', 'admin'],
    title: 'Pending Approvals by Board Member',
    mysqlView: 'vw_board_member_pending_approvals',
    filters: ['board_member_id', 'property_id']
  },
  {
    id: 'board_capital_spend_summary_ytd',
    roles: ['board', 'admin'],
    title: 'Capital Spend Summary (YTD)',
    mysqlView: 'vw_board_capital_spend_summary_ytd',
    filters: ['property_id']
  }
];

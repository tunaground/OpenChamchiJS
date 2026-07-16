export interface AdminSidebarLabels {
  admin: string;
  backToHome: string;
  boards: string;
  users: string;
  settings: string;
  globalNotices: string;
}

export interface AdminBoardSidebarLabels extends AdminSidebarLabels {
  threads: string;
  responses: string;
  notices: string;
}

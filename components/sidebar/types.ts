export interface AdminSidebarLabels {
  admin: string;
  backToHome: string;
  boards: string;
  users: string;
  roles?: string;
  settings?: string;
}

export interface AdminBoardSidebarLabels extends AdminSidebarLabels {
  threads: string;
  notices: string;
}

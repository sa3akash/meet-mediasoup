import { adminOverviewService } from "./services/admin-overview-service";
import { adminUsersService } from "./services/admin-users-service";
import { adminMeetingsService } from "./services/admin-meetings-service";

export class AdminService {
  public getOverviewStats = adminOverviewService.getOverviewStats.bind(adminOverviewService);
  public getStorageOverview = adminOverviewService.getStorageOverview.bind(adminOverviewService);

  public getUsers = adminUsersService.getUsers.bind(adminUsersService);
  public updateUserRole = adminUsersService.updateUserRole.bind(adminUsersService);
  public deleteUser = adminUsersService.deleteUser.bind(adminUsersService);

  public getMeetings = adminMeetingsService.getMeetings.bind(adminMeetingsService);
  public terminateMeeting = adminMeetingsService.terminateMeeting.bind(adminMeetingsService);
  public getRecordings = adminMeetingsService.getRecordings.bind(adminMeetingsService);
  public deleteRecording = adminMeetingsService.deleteRecording.bind(adminMeetingsService);
}

export const adminService = new AdminService();

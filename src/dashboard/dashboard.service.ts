import { UserType } from '@/app/contracts/enums/usertype.enum';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { DashboardRepository } from '@/app/repositories/dashboard/dashboard.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  public async getDashboard(user: JwtPayload) {
    if (user.user_type === UserType.SuperAdmin) {
      return this.dashboardRepository.getSuperAdminDashboardData();
    }

    if (
      [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(user.user_type)
    ) {
      return this.dashboardRepository.getFranchiseAdminDashboardData(user);
    }

    if (user.user_type === UserType.Owner) {
      return this.dashboardRepository.getOwnerDashboardData(user);
    }

    if (user.user_type === UserType.Vendor) {
      return this.dashboardRepository.getVendorDashboardData(user);
    }
  }
}

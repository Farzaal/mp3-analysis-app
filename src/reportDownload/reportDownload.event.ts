import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';

export class GenericReportDownloadEvent<T> {
  constructor(
    public readonly getter: () => Promise<{
      data: T[];
      count: number;
    }>,
    public readonly user: JwtPayload,
  ) {}
}

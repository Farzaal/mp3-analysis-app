import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateFranchiseLinenConfigDto,
  UpdateFranchiseLinenConfigDto,
} from './franchiseLinenConfig.dto';
import { FranchiseLinenConfigModel } from '@/app/models/linen/franchiseLinenConfig.model';
import { ServiceTypeRepository } from '@/app/repositories/serviceType/serviceType.respository';
import { FranchiseLinenConfigRepository } from '@/app/repositories/linen/franchiseLinenConfig.repository';
import { FranchiseLinenConfigMessages } from './franchiseLinenConfig.messeges';
import { LinenType } from '@/app/contracts/enums/linenType.enum';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { PaginationParam } from '@/app/commons/base.request';
import { IPaginatedModelResponse } from '@/app/contracts/interfaces/paginatedModelResponse.interface';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';
import { GeneralHelper } from '@/app/utils/general.helper';

@Injectable()
export class FranchiseLinenConfigService {
  constructor(
    private readonly serviceTypeRepository: ServiceTypeRepository,
    private readonly franchiseLinenConfigRepository: FranchiseLinenConfigRepository,
    private readonly generalHelper: GeneralHelper,
  ) {}

  async validatePayloadForLinenConfig(
    payload: CreateFranchiseLinenConfigDto | UpdateFranchiseLinenConfigDto,
    service_type_id: number,
  ): Promise<void> {
    const serviceType = await this.serviceTypeRepository.findOne({
      where: { id: service_type_id },
    });

    if (!serviceType) {
      throw new BadRequestException(
        FranchiseLinenConfigMessages.SERVICE_TYPE_NOT_FOUND,
      );
    }

    if (!serviceType.is_linen) {
      throw new BadRequestException(
        FranchiseLinenConfigMessages.SERVICE_TYPE_NOT_LINEN,
      );
    }

    if (payload.type === LinenType.ProductType && !payload.product_type) {
      throw new BadRequestException(
        FranchiseLinenConfigMessages.PRODUCT_TYPE_REQUIRED,
      );
    }

    if (
      payload.type === LinenType.NumberOfBedrooms &&
      !payload.number_of_bedrooms
    ) {
      throw new BadRequestException(
        FranchiseLinenConfigMessages.NUMBER_OF_BEDROOMS_REQUIRED,
      );
    }

    if (
      (payload.type === LinenType.NumberOfBedrooms && payload.product_type) ||
      (payload.type === LinenType.ProductType && payload.number_of_bedrooms)
    )
      throw new BadRequestException(
        FranchiseLinenConfigMessages.INVALID_PAYLOAD,
      );
  }

  async create(
    payload: CreateFranchiseLinenConfigDto,
    user: JwtPayload,
  ): Promise<FranchiseLinenConfigModel> {
    const whereClause: any = {
      type: payload.type,
      franchise_id: Number(user.franchise_id),
      delivery_type: payload.delivery_type,
      is_deleted: false,
    };

    // This condition will be replaced once we add is_linen to service type modal
    const linenServiceType = await this.serviceTypeRepository.findOne({
      where: { is_linen: true },
    });

    if (!linenServiceType)
      throw new Error(FranchiseLinenConfigMessages.SERVICE_TYPE_NOT_FOUND);

    await this.validatePayloadForLinenConfig(
      payload,
      Number(linenServiceType?.id),
    );

    if (payload.type === LinenType.ProductType) {
      whereClause.product_type = payload.product_type;
    }

    if (payload.type === LinenType.NumberOfBedrooms) {
      whereClause.number_of_bedrooms = payload.number_of_bedrooms;
    }

    whereClause.service_type_id = linenServiceType.id;
    const existingFranchiseLinenConfig =
      await this.franchiseLinenConfigRepository.findOne({
        where: whereClause,
      });

    if (existingFranchiseLinenConfig) {
      throw new BadRequestException(
        FranchiseLinenConfigMessages.FRANCHISE_LINEN_CONFIG_EXISTS,
      );
    }

    const franchiseLinenConfigModel =
      await this.franchiseLinenConfigRepository.create({
        ...payload,
        service_type_id: linenServiceType.id,
        franchise_id: Number(user.franchise_id),
      });

    const franchiseLinenConfig = await this.franchiseLinenConfigRepository.save(
      franchiseLinenConfigModel,
    );
    return franchiseLinenConfig;
  }

  async getLinenConfigs(
    type: LinenType,
    query: PaginationParam,
    user: JwtPayload,
  ): Promise<IPaginatedModelResponse<FranchiseLinenConfigModel>> {
    const paginationParams: IPaginationDBParams =
      this.generalHelper.getPaginationOptionsV2(query);

    return await this.franchiseLinenConfigRepository.getAllLinenConfigs(
      paginationParams,
      type,
      Number(user.franchise_id),
    );
  }

  async getLinenConfig(
    linenConfigId: string,
    user: JwtPayload,
  ): Promise<FranchiseLinenConfigModel> {
    const linenConfig = await this.franchiseLinenConfigRepository.findOne({
      where: {
        id: Number(linenConfigId),
        franchise_id: Number(user.franchise_id),
        is_deleted: false,
      },
    });

    if (!linenConfig) {
      throw new BadRequestException(
        FranchiseLinenConfigMessages.FRANCHISE_LINEN_CONFIG_NOT_FOUND,
      );
    }

    return linenConfig;
  }

  async deleteLinenConfig(
    linenConfigId: string,
    user: JwtPayload,
  ): Promise<void> {
    await this.getLinenConfig(linenConfigId, user);

    await this.franchiseLinenConfigRepository.delete(
      {
        id: Number(linenConfigId),
        franchise_id: Number(user.franchise_id),
      },
      false,
    );
  }

  async updateLinenConfig(
    payload: UpdateFranchiseLinenConfigDto,
    user: JwtPayload,
  ): Promise<FranchiseLinenConfigModel> {
    const { linen_config_id, ...data } = payload;
    const franchiseLinenConfig = await this.getLinenConfig(
      linen_config_id.toString(),
      user,
    );

    const linenServiceType = await this.serviceTypeRepository.findOne({
      where: { is_linen: true },
    });

    if (!linenServiceType)
      throw new Error(FranchiseLinenConfigMessages.SERVICE_TYPE_NOT_FOUND);

    await this.validatePayloadForLinenConfig(
      payload,
      Number(linenServiceType?.id),
    );

    if (data.type === LinenType.ProductType) {
      data.number_of_bedrooms = null;
    } else if (data.type === LinenType.NumberOfBedrooms) {
      data.product_type = null;
    }

    await this.franchiseLinenConfigRepository.update(
      { id: franchiseLinenConfig.id },
      data,
    );

    return await this.getLinenConfig(linen_config_id.toString(), user);
  }
}

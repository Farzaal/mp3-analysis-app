import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource, Brackets, QueryRunner } from 'typeorm';
import { EstimateMasterModel } from '@/app/models/estimate/estimateMaster.model';
import { IPaginationDBParams } from '../../contracts/interfaces/paginationDBParams.interface';
import { IPaginatedModelResponse } from '../../contracts/interfaces/paginatedModelResponse.interface';
import { EstimateQueryDto } from '@/estimate/estimate.dto';
import { IEstimateRequestParams } from '@/app/contracts/interfaces/estimate.interface';
import { DistributionType } from '@/app/contracts/enums/distributionType';
import {
  EstimateOwnerStatus,
  EstimateStatus,
  EstimateVendorStatus,
  QuoteStatus,
} from '@/app/contracts/enums/estimate.enum';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { EstimateDetailModel } from '@/app/models/estimate/estimateDetail.model';

@Injectable()
export class EstimateMasterRepository extends PostgresRepository<EstimateMasterModel> {
  constructor(dataSource: DataSource) {
    super(EstimateMasterModel, dataSource);
  }

  public async getEstimates(
    params: IPaginationDBParams,
    user: JwtPayload,
    query: EstimateQueryDto,
    estimateParams?: IEstimateRequestParams,
  ): Promise<IPaginatedModelResponse<EstimateMasterModel>> {
    const { offset, limit } = params;
    const { start_date, end_date, property_master_id, service_type_id } = query;
    const { franchise_id } = user;
    const {
      vendor_id,
      status,
      owner_id,
      estimate_details,
      is_send_to_owner,
      vendor_assigned_job,
    } = estimateParams || {};

    const queryBuilder = this.repository
      .createQueryBuilder('estimate_masters')
      .where('estimate_masters.franchise_id = :franchise_id', {
        franchise_id: Number(franchise_id),
      })
      .andWhere('estimate_masters.is_deleted = :isDeleted', {
        isDeleted: false,
      })
      .skip(offset)
      .take(limit)
      .leftJoinAndSelect('estimate_masters.propertyMaster', 'property')
      .leftJoinAndSelect('estimate_masters.serviceType', 'serviceType');

    if (start_date) {
      queryBuilder.andWhere('estimate_masters.start_date >= :start_date', {
        start_date,
      });
    }

    if (end_date) {
      queryBuilder.andWhere('estimate_masters.start_date <= :end_date', {
        end_date,
      });
    }

    if (property_master_id) {
      queryBuilder.andWhere(
        'estimate_masters.property_master_id = :property_master_id',
        {
          property_master_id,
        },
      );
    }

    if (service_type_id) {
      queryBuilder.andWhere(
        'estimate_masters.service_type_id = :service_type_id',
        {
          service_type_id,
        },
      );
    }

    if (vendor_assigned_job === undefined && status) {
      queryBuilder.andWhere('estimate_masters.status = :status', {
        status,
      });
    }

    if (owner_id) {
      queryBuilder.andWhere('estimate_masters.owner_id = :owner_id', {
        owner_id,
      });
    }

    if (estimate_details || is_send_to_owner !== undefined) {
      queryBuilder
        .innerJoinAndSelect(
          'estimate_masters.estimateDetail',
          'estimateDetail',
          `
          estimateDetail.is_grand_total = :isGrandTotal 
          AND estimateDetail.is_send_to_owner = :isSendToOwner 
          AND estimateDetail.is_estimate_approved = :isEstimateApproved
          ${is_send_to_owner ? 'AND estimateDetail.franchise_admin_id IS NOT NULL' : 'AND estimateDetail.franchise_admin_id IS NULL'}
          `,
          {
            isGrandTotal: true,
            isSendToOwner: is_send_to_owner,
            isEstimateApproved: false,
          },
        )
        .leftJoinAndSelect('estimateDetail.estimateVendor', 'user');
    }

    if (vendor_assigned_job && vendor_id) {
      queryBuilder
        .leftJoinAndSelect(
          'serviceType.vendorServiceType',
          'vendorServiceType',
          'vendorServiceType.vendor_id = :vendor_id',
          { vendor_id: Number(vendor_id) },
        )
        .leftJoinAndSelect('vendorServiceType.vendor', 'vendor')
        .andWhere('vendor.is_approved = :isApproved', { isApproved: true });

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('estimate_masters.status NOT IN (:...statuses)', {
            statuses: [
              EstimateStatus.EstimateApprovedByOwner,
              EstimateStatus.EstimateRejectedByOwner,
            ],
          });
          /**
           * @Info: Distribute to all vendors
           * @Description: This is the condition for distribute to all vendors
           * @Condition: estimate_distribution_type = DistributeToAllVendors
           * @Condition: NOT EXISTS (SELECT 1 FROM estimate_details ed WHERE ed.estimate_master_id = estimate_masters.id AND ed.vendor_id = :vendor_id)
           */
          qb.andWhere(
            new Brackets((subQb) => {
              subQb
                .where('estimate_masters.estimate_distribution_type = :type1', {
                  type1: DistributionType.DistributeToAllVendors,
                })
                .andWhere(
                  `(NOT EXISTS (
                    SELECT 1 FROM estimate_details ed
                    WHERE ed.estimate_master_id = estimate_masters.id
                    AND ed.vendor_id = :vendor_id
                  ))`,
                  { vendor_id: vendor_id },
                );
            }),
          );

          /**
           * @Info: Selected vendor
           * @Description: This is the condition for selected vendor
           * @Condition: estimate_distribution_type = SelectedVendor
           * @Condition: estimate_masters.vendor_id = :vendor_id
           * @Condition: estimate_masters.status = EstimateVendorAssignment
           */
          qb.orWhere(
            new Brackets((subQb) => {
              subQb
                .where('estimate_masters.estimate_distribution_type = :type3', {
                  type3: DistributionType.SelectedVendor,
                })
                .andWhere('estimate_masters.vendor_id = :vendor_id', {
                  vendor_id: vendor_id,
                })
                .andWhere('estimate_masters.status = :status', {
                  status: EstimateStatus.EstimateVendorAssignment,
                });
            }),
          );

          /**
           * @Info: Preferred vendor
           * @Description: This is the condition for preferred vendor
           * @Condition: estimate_distribution_type = PreferredVendor
           * @Condition: estimate_masters.status = EstimateVendorAssignment
           * @Condition: EXISTS (SELECT 1 FROM vendor_service_type_priorities vstp WHERE vstp.vendor_id = :vendor_id AND vstp.property_id = estimate_masters.property_master_id)
           */
          qb.orWhere(
            new Brackets((subQb) => {
              subQb
                .where('estimate_masters.estimate_distribution_type = :type4', {
                  type4: DistributionType.PreferredVendor,
                })
                // .andWhere('estimate_masters.status = :status', {
                //   status: EstimateStatus.EstimateVendorAssignment,
                // })
                .andWhere(
                  `(EXISTS (
                    SELECT 1 FROM vendor_service_type_priorities vstp
                    WHERE vstp.vendor_id = :vendor_id
                    AND vstp.property_master_id = estimate_masters.property_master_id
                    AND vstp.service_type_id = estimate_masters.service_type_id
                  ))`,
                  { vendor_id: vendor_id },
                )
                .andWhere(
                  `(NOT EXISTS (
                    SELECT 1 FROM estimate_details ed
                    WHERE ed.estimate_master_id = estimate_masters.id
                    AND ed.vendor_id = :vendor_id
                  ))`,
                  { vendor_id: vendor_id },
                );
            }),
          );

          /**
           * @Info: Multiple vendors
           * @Description: This is the condition for multiple vendors
           * @Condition: estimate_distribution_type = MultipleVendors
           * @Condition: estimate_masters.status = EstimateVendorAssignment
           * @Condition: EXISTS (SELECT 1 FROM vendor_service_type_priorities vstp WHERE vstp.vendor_id = :vendor_id AND vstp.property_id = estimate_masters.property_master_id)
           */

          qb.orWhere(
            new Brackets((subQb) => {
              subQb
                .where('estimate_masters.estimate_distribution_type = :type5', {
                  type5: DistributionType.MultipleVendors,
                })
                .andWhere(
                  `(EXISTS (
                    SELECT 1 FROM estimate_vendor_distributions evd
                    WHERE evd.vendor_id = :vendor_id
                    AND evd.property_master_id = estimate_masters.property_master_id
                    AND evd.estimate_master_id = estimate_masters.id
                  ))`,
                  { vendor_id: vendor_id },
                )
                .andWhere(
                  `(NOT EXISTS (
                    SELECT 1 FROM estimate_details ed
                    WHERE ed.estimate_master_id = estimate_masters.id
                    AND ed.vendor_id = :vendor_id
                  ))`,
                  { vendor_id: vendor_id },
                );
            }),
          );
        }),
      );

      queryBuilder.andWhere('vendorServiceType.id IS NOT NULL');
    }

    if (vendor_assigned_job === undefined && vendor_id) {
      queryBuilder.leftJoinAndSelect(
        'serviceType.vendorServiceType',
        'vendorServiceType',
        'vendorServiceType.vendor_id = :vendor_id',
        {
          vendor_id: Number(vendor_id),
        },
      );

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('vendorServiceType.id IS NOT NULL').andWhere(
            'estimate_masters.estimate_distribution_type = :type1',
            {
              type1: DistributionType.DistributeToAllVendors,
            },
          );

          qb.orWhere(
            '(estimate_masters.estimate_distribution_type IN (:type2) AND estimate_masters.vendor_id = :vendor_id)',
            {
              type2: DistributionType.SelectedVendor,
              vendor_id,
            },
          );

          qb.andWhere('estimate_masters.status = :status', {
            status: EstimateStatus.EstimateVendorAssignment,
          });
        }),
      );

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('vendorServiceType.id IS NOT NULL');
        }),
      );
    }

    const selectCols = [
      'estimate_masters.id',
      'estimate_masters.start_date',
      'estimate_masters.vendor_id',
      'estimate_masters.status',
      'estimate_masters.estimate_distribution_type',
      'serviceType.id',
      'serviceType.title',
      'property.id',
      'property.property_nick_name',
      'property.address',
      'serviceType.id',
      'serviceType.title',
    ];

    if (estimate_details || is_send_to_owner) {
      selectCols.push(
        'estimateDetail.id',
        'estimateDetail.line_item',
        'estimateDetail.price',
        'estimateDetail.is_estimate_approved',
        'estimateDetail.is_grand_total',
        'estimateDetail.is_send_to_owner',
        'user.id',
        'user.first_name',
        'user.last_name',
      );
    }
    queryBuilder.select(selectCols);

    const [data, count] = await queryBuilder
      .orderBy('estimate_masters.id', 'DESC')
      .getManyAndCount();

    return { data, count };
  }

  public async getEstimate(
    estimate_id: number,
    user: JwtPayload,
    vendor_id?: number,
  ): Promise<EstimateMasterModel> {
    const baseQueryBuilder = this.repository
      .createQueryBuilder('estimate_masters')
      .where('estimate_masters.id = :estimate_id', { estimate_id })
      .andWhere('estimate_masters.is_deleted = :isDeleted', {
        isDeleted: false,
      })
      .andWhere('estimate_masters.franchise_id = :franchise_id', {
        franchise_id: Number(user.franchise_id),
      });
    // .andWhere('estimate_masters.status NOT IN (:...status)', {
    //   status: [
    //     EstimateStatus.EstimateApprovedByOwner,
    //     EstimateStatus.EstimateRejectedByOwner,
    //   ],
    // });

    if (user.user_type === UserType.Owner) {
      baseQueryBuilder.andWhere('estimate_masters.owner_id = :owner_id', {
        owner_id: Number(user.id),
      });
    }

    baseQueryBuilder
      .leftJoinAndSelect('estimate_masters.propertyMaster', 'propertyMaster')
      .leftJoinAndSelect('estimate_masters.vendor', 'vendor')
      .leftJoinAndSelect('estimate_masters.owner', 'owner')
      .leftJoinAndSelect('propertyMaster.owner', 'propertyOwner')
      .leftJoinAndSelect('estimate_masters.serviceType', 'serviceType')
      .leftJoinAndSelect('estimate_masters.estimateAsset', 'estimateAsset')
      .leftJoinAndSelect(
        'serviceType.serviceTypeCategory',
        'serviceTypeCategory',
      )
      .leftJoinAndSelect(
        'estimate_masters.estimateDetail',
        'estimateDetail',
        'estimateDetail.estimate_master_id = :estimate_id',
        { estimate_id },
      )
      .leftJoinAndSelect('estimateDetail.estimateVendor', 'estimateVendor')
      .leftJoinAndSelect(
        'estimate_masters.estimateDescription',
        'estimateDescription',
        vendor_id
          ? `estimateDescription.estimate_master_id = :estimate_id ${[UserType.FranchiseAdmin, UserType.StandardAdmin, UserType.Owner].includes(user.user_type) ? `AND estimateDescription.vendor_id = :user_id` : `AND estimateDescription.user_id = :user_id`}`
          : 'estimateDescription.estimate_master_id = :estimate_id',
        vendor_id ? { estimate_id, user_id: vendor_id } : { estimate_id },
      )
      .leftJoinAndSelect(
        'estimateDescription.estimateDescriptionAddedBy',
        'estimateDescriptionAddedBy',
      );

    const estimateDetailsExist = await baseQueryBuilder
      .clone()
      .select('estimateDetail.id')
      .getRawOne();

    if (estimateDetailsExist?.estimateDetail_id) {
      if (
        user.user_type === UserType.FranchiseAdmin ||
        user.user_type === UserType.StandardAdmin ||
        user.user_type === UserType.Owner
      ) {
        const primaryConditionQuery = baseQueryBuilder.clone();
        primaryConditionQuery.andWhere(
          `
          (
            (estimateDetail.franchise_admin_id IS NOT NULL 
            AND estimateDetail.is_send_to_owner = :isSendToOwner
            AND estimateDetail.estimate_master_id = :estimate_master_id)
          ) 
          OR 
          (
            estimateDetail.id IS NULL 
            AND estimateDetail.estimate_master_id = :estimate_master_id
          )
          `,
          {
            isSendToOwner: true,
            estimate_master_id: estimate_id,
          },
        );

        let estimate = null;
        if (!vendor_id) {
          estimate = await primaryConditionQuery.getOne();
        }

        if (!estimate) {
          const fallbackConditionQuery = baseQueryBuilder.clone();

          fallbackConditionQuery.andWhere(
            `
          (
            (estimateDetail.vendor_id IS NOT NULL 
            ${vendor_id ? 'AND estimateDetail.vendor_id = :vendor_id' : ''}
            AND estimateDetail.franchise_admin_id IS NULL
            AND estimateDetail.estimate_master_id = :estimate_master_id) 
          )
          OR
          (
            estimateDetail.id IS NULL
            AND estimateDetail.estimate_master_id = :estimate_master_id
          )
          `,
            {
              estimate_master_id: estimate_id,
              ...(vendor_id && { vendor_id }),
            },
          );

          estimate = await fallbackConditionQuery.getOne();
        }

        return estimate;
      }
    }

    if (user.user_type === UserType.Vendor) {
      const vendorEstimateExist = await baseQueryBuilder
        .clone()
        .select('estimateDetail.id')
        .andWhere('estimateDetail.estimate_master_id = :estimate_master_id', {
          estimate_master_id: estimate_id,
        })
        .andWhere('estimateDetail.vendor_id = :vendor_id', {
          vendor_id: Number(user.id),
        })
        .getRawOne();

      if (vendorEstimateExist) {
        baseQueryBuilder.andWhere(
          `
          (
            estimateDetail.franchise_admin_id IS NULL 
            AND estimateDetail.vendor_id = :vendor_id 
            AND estimateDetail.is_send_to_owner = :isSendToOwner
            AND estimateDetail.estimate_master_id = :estimate_master_id
          )
          OR (
            estimateDetail.id IS NULL 
            AND estimateDetail.estimate_master_id = :estimate_master_id
          )
          `,
          {
            vendor_id: Number(user.id),
            isSendToOwner: false,
            estimate_master_id: estimate_id,
          },
        );
      }
    }

    return await baseQueryBuilder.getOne();
  }

  public async getQuotationsForEstimate(
    estimate_master_id: number,
    user: JwtPayload,
    vendor_id?: number,
  ): Promise<EstimateMasterModel> {
    const baseQueryBuilder = this.repository
      .createQueryBuilder('estimate_masters')
      .where('estimate_masters.id = :estimate_id', {
        estimate_id: estimate_master_id,
      })
      .andWhere('estimate_masters.is_deleted = :isDeleted', {
        isDeleted: false,
      })
      .andWhere('estimate_masters.franchise_id = :franchise_id', {
        franchise_id: Number(user.franchise_id),
      });

    baseQueryBuilder
      .leftJoinAndSelect('estimate_masters.propertyMaster', 'propertyMaster')
      .leftJoinAndSelect('estimate_masters.vendor', 'vendor')
      .leftJoinAndSelect('estimate_masters.owner', 'owner')
      .leftJoinAndSelect('propertyMaster.owner', 'propertyOwner')
      .leftJoinAndSelect('estimate_masters.serviceType', 'serviceType')
      .leftJoinAndSelect(
        'estimate_masters.serviceRequestMasterEstimate',
        'serviceRequestMasterEstimate',
      )
      .leftJoinAndSelect('estimate_masters.estimateAsset', 'estimateAsset')
      .leftJoinAndSelect(
        'serviceType.serviceTypeCategory',
        'serviceTypeCategory',
      );
    if (vendor_id) {
      baseQueryBuilder.leftJoinAndSelect(
        'estimate_masters.estimateDescription',
        'estimateDescription',
        'estimateDescription.estimate_master_id = :estimate_master_id AND estimateDescription.user_id = :vendor_id',
        { estimate_master_id, vendor_id },
      );
    }
    if (
      [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(user.user_type)
    ) {
      baseQueryBuilder
        .leftJoinAndSelect(
          'estimate_masters.estimateDetail',
          'estimateDetail',
          'estimateDetail.estimate_master_id = :estimate_id AND estimateDetail.franchise_admin_id = :franchise_admin_id AND estimateDetail.is_send_to_owner = :isSendToOwner AND estimateDetail.vendor_id = :vendor_id',
          {
            estimate_id: estimate_master_id,
            franchise_admin_id:
              user.user_type === UserType.StandardAdmin
                ? Number(user?.franchise_admin)
                : Number(user?.id),
            isSendToOwner: true,
            ...(vendor_id && { vendor_id }),
          },
        )
        .leftJoinAndSelect('estimateDetail.estimateVendor', 'estimateVendor');
    }

    if (user.user_type === UserType.Owner) {
      baseQueryBuilder.andWhere('estimate_masters.owner_id = :owner_id', {
        owner_id: Number(user.id),
      });

      baseQueryBuilder
        .leftJoinAndSelect(
          'estimate_masters.estimateDetail',
          'estimateDetail',
          'estimateDetail.estimate_master_id = :estimate_id AND estimateDetail.franchise_admin_id IS NOT NULL AND estimateDetail.is_send_to_owner = :isSendToOwner AND estimateDetail.vendor_id = :vendor_id',
          {
            estimate_id: estimate_master_id,
            isSendToOwner: true,
            ...(vendor_id && { vendor_id }),
          },
        )
        .leftJoinAndSelect('estimateDetail.estimateVendor', 'estimateVendor');
    }

    if (user.user_type === UserType.Vendor) {
      baseQueryBuilder
        .leftJoinAndSelect(
          'estimate_masters.estimateDescription',
          'estimateDescription',
          `(estimateDescription.estimate_master_id = :estimate_id AND estimateDescription.user_id = :vendor_id)
            OR
           (estimateDescription.estimate_master_id = :estimate_id AND estimateDescription.user_id = estimate_masters.owner_id AND estimateDescription.is_estimate_reject_description = TRUE)`,
          {
            estimate_id: estimate_master_id,
            vendor_id: Number(user.id),
            isSendToOwner: false,
          },
        )
        .leftJoinAndSelect(
          'estimate_masters.estimateDetail',
          'estimateDetail',
          `(estimateDetail.estimate_master_id = :estimate_id AND estimateDetail.vendor_id = :vendor_id AND estimateDetail.franchise_admin_id IS NULL)`,
          {
            estimate_id: estimate_master_id,
            vendor_id: Number(user.id),
          },
        )
        .leftJoinAndSelect('estimateDetail.estimateVendor', 'estimateVendor');
    }

    const data = await baseQueryBuilder.getOne();

    if (user.user_type === UserType.Vendor) {
      const [{ status }] = await this.getEstimateStatusForVendor(
        estimate_master_id,
        user,
      );
      data.estimate_status = status;
    }

    return data;
  }

  public async getQuotedEstimates(
    params: IPaginationDBParams,
    user: JwtPayload,
    query: EstimateQueryDto,
    estimateParams?: IEstimateRequestParams,
  ): Promise<IPaginatedModelResponse<any>> {
    const { offset, limit } = params;
    const { start_date, end_date, property_master_id, service_type_id } = query;
    const { franchise_id } = user;
    const { estimate_details, is_send_to_owner, status, owner_id } =
      estimateParams || {};

    const queryBuilder = this.repository
      .createQueryBuilder('estimate_masters')
      .leftJoin('estimate_masters.propertyMaster', 'property')
      .leftJoin('estimate_masters.serviceType', 'serviceType')
      .leftJoin('estimate_masters.estimateDetail', 'estimateDetail')
      .leftJoin('estimateDetail.estimateVendor', 'user')
      .where('estimate_masters.franchise_id = :franchise_id', {
        franchise_id: Number(franchise_id),
      })
      .andWhere('estimate_masters.is_deleted = :isDeleted', {
        isDeleted: false,
      });

    if (start_date) {
      queryBuilder.andWhere('estimate_masters.start_date >= :start_date', {
        start_date,
      });
    }

    if (end_date) {
      queryBuilder.andWhere('estimate_masters.start_date <= :end_date', {
        end_date,
      });
    }

    if (property_master_id) {
      queryBuilder.andWhere(
        'estimate_masters.property_master_id = :property_master_id',
        { property_master_id },
      );
    }

    if (service_type_id) {
      queryBuilder.andWhere(
        'estimate_masters.service_type_id = :service_type_id',
        { service_type_id },
      );
    }

    if (owner_id) {
      queryBuilder.andWhere('estimate_masters.owner_id = :owner_id', {
        owner_id,
      });
    }

    if (status) {
      queryBuilder.andWhere('estimate_masters.status = :status', { status });
    }

    if (estimate_details || is_send_to_owner !== undefined) {
      queryBuilder.andWhere(
        `estimateDetail.is_grand_total = :isGrandTotal 
         AND estimateDetail.is_send_to_owner = :isSendToOwner 
         AND estimateDetail.is_estimate_approved = :isEstimateApproved`,
        {
          isGrandTotal: true,
          isSendToOwner: is_send_to_owner,
          isEstimateApproved: false,
        },
      );
    }

    if (is_send_to_owner) {
      queryBuilder.andWhere('estimateDetail.franchise_admin_id IS NOT NULL');
    } else {
      queryBuilder.andWhere('estimateDetail.franchise_admin_id IS NULL');
    }

    queryBuilder.select([
      'estimate_masters.id AS estimate_master_id',
      'estimate_masters.vendor_id AS vendor_id',
      'estimate_masters.start_date AS start_date',
      'estimate_masters.status AS status',
      'estimate_masters.estimate_distribution_type AS estimate_distribution_type',
      'property.id AS property_id',
      'property.property_nick_name AS property_nick_name',
      'property.address AS property_address',
      'serviceType.id AS service_type_id',
      'serviceType.title AS service_type_title',
      'estimateDetail.id AS estimate_detail_id',
      'estimateDetail.line_item AS line_item',
      'estimateDetail.price AS price',
      'estimateDetail.is_estimate_approved AS is_estimate_approved',
      'estimateDetail.is_grand_total AS is_grand_total',
      'estimateDetail.is_send_to_owner AS is_send_to_owner',
      'user.id AS vendor_user_id',
      'user.first_name AS vendor_first_name',
      'user.last_name AS vendor_last_name',
    ]);

    queryBuilder.orderBy('estimate_masters.id', 'DESC');

    const totalCount = await queryBuilder.getCount();

    // queryBuilder.skip(offset).take(limit);
    queryBuilder.offset(offset).limit(limit);

    const rawData = await queryBuilder.getRawMany();

    return {
      data: rawData,
      count: totalCount,
    };
  }

  public async getOwnerApprovalEstimates(
    params: IPaginationDBParams,
    user: JwtPayload,
    query: EstimateQueryDto,
    estimateParams?: IEstimateRequestParams,
  ): Promise<IPaginatedModelResponse<any>> {
    const { offset, limit } = params;
    const { start_date, end_date } = query;
    const { franchise_id } = user;
    const { estimate_details, is_send_to_owner, status, owner_id } =
      estimateParams || {};

    const queryBuilder = this.repository
      .createQueryBuilder('estimate_masters')
      .leftJoin('estimate_masters.propertyMaster', 'property')
      .leftJoin('estimate_masters.serviceType', 'serviceType')
      .leftJoin('estimate_masters.estimateDetail', 'estimateDetail')
      .leftJoin('estimateDetail.estimateVendor', 'user')
      .where('estimate_masters.franchise_id = :franchise_id', {
        franchise_id: Number(franchise_id),
      })
      .andWhere('estimate_masters.is_deleted = :isDeleted', {
        isDeleted: false,
      });

    if (start_date) {
      queryBuilder.andWhere('estimate_masters.start_date >= :start_date', {
        start_date,
      });
    }

    if (end_date) {
      queryBuilder.andWhere('estimate_masters.start_date <= :end_date', {
        end_date,
      });
    }

    if (owner_id) {
      queryBuilder.andWhere('estimate_masters.owner_id = :owner_id', {
        owner_id,
      });
    }

    if (status) {
      queryBuilder.andWhere('estimate_masters.status = :status', { status });
    }

    if (estimate_details || is_send_to_owner !== undefined) {
      queryBuilder.andWhere(
        `estimateDetail.is_grand_total = :isGrandTotal 
         AND estimateDetail.is_send_to_owner = :isSendToOwner 
         AND estimateDetail.is_estimate_approved = :isEstimateApproved`,
        {
          isGrandTotal: true,
          isSendToOwner: is_send_to_owner,
          isEstimateApproved: false,
        },
      );
    }

    if (is_send_to_owner) {
      queryBuilder.andWhere('estimateDetail.franchise_admin_id IS NOT NULL');
    } else {
      queryBuilder.andWhere('estimateDetail.franchise_admin_id IS NULL');
    }

    const selectCols = [
      'estimate_masters.id',
      'estimate_masters.start_date',
      'estimate_masters.vendor_id',
      'estimate_masters.status',
      'estimate_masters.estimate_distribution_type',
      'serviceType.id',
      'serviceType.title',
      'property.id',
      'property.property_nick_name',
      'property.address',
      'serviceType.id',
      'serviceType.title',
    ];

    queryBuilder.select(selectCols);
    queryBuilder.skip(offset).take(limit);
    const [data, count] = await queryBuilder
      .orderBy('estimate_masters.id', 'DESC')
      .getManyAndCount();

    return { data, count };
  }

  public async getApprovedQuotations(
    params: IPaginationDBParams,
    user: JwtPayload,
    query: EstimateQueryDto,
  ): Promise<IPaginatedModelResponse<EstimateMasterModel>> {
    const { offset, limit } = params;
    const { start_date, end_date, property_master_id, service_type_id } = query;
    const { franchise_id } = user;

    const queryBuilder = this.repository
      .createQueryBuilder('estimate_masters')
      .leftJoin('estimate_masters.propertyMaster', 'property')
      .leftJoin('estimate_masters.serviceType', 'serviceType')
      .leftJoin('estimate_masters.vendor', 'vendor')
      .leftJoin('serviceType.serviceTypeCategory', 'serviceTypeCategory')
      .where('estimate_masters.franchise_id = :franchise_id', {
        franchise_id: Number(franchise_id),
      })
      .andWhere('estimate_masters.is_deleted = :isDeleted', {
        isDeleted: false,
      });

    // Join to estimate details
    queryBuilder
      .leftJoin('estimate_masters.estimateDetail', 'estimateDetail')
      .andWhere('estimateDetail.is_grand_total = :isGrandTotal', {
        isGrandTotal: true,
      })
      .andWhere('estimateDetail.is_estimate_approved = :isEstimateApproved', {
        isEstimateApproved: true,
      })
      .andWhere('estimateDetail.franchise_admin_id IS NOT NULL');

    if (start_date) {
      queryBuilder.andWhere('estimate_masters.start_date >= :start_date', {
        start_date,
      });
    }

    if (end_date) {
      queryBuilder.andWhere('estimate_masters.start_date <= :end_date', {
        end_date,
      });
    }

    if (property_master_id) {
      queryBuilder.andWhere(
        'estimate_masters.property_master_id = :property_master_id',
        { property_master_id },
      );
    }

    if (service_type_id) {
      queryBuilder.andWhere(
        'estimate_masters.service_type_id = :service_type_id',
        { service_type_id },
      );
    }

    queryBuilder.select([
      'estimate_masters.id AS estimate_master_id',
      'estimate_masters.vendor_id AS vendor_id',
      'estimate_masters.start_date AS start_date',
      'estimate_masters.status AS status',
      'estimate_masters.estimate_distribution_type AS estimate_distribution_type',
      'property.id AS property_id',
      'property.property_nick_name AS property_nick_name',
      'property.address AS property_address',
      'serviceType.id AS service_type_id',
      'serviceType.title AS service_type_title',
      'estimateDetail.id AS estimate_detail_id',
      'estimateDetail.line_item AS line_item',
      'estimateDetail.price AS price',
      'estimateDetail.is_estimate_approved AS is_estimate_approved',
      'estimateDetail.is_grand_total AS is_grand_total',
      'estimateDetail.is_send_to_owner AS is_send_to_owner',
      'vendor.id AS vendor_id',
      'vendor.first_name AS vendor_first_name',
      'vendor.last_name AS vendor_last_name',
    ]);

    queryBuilder.orderBy('estimate_masters.id', 'DESC');

    const totalCount = await queryBuilder.getCount();

    // queryBuilder.skip(offset).take(limit);
    queryBuilder.offset(offset).limit(limit);

    const rawData = await queryBuilder.getRawMany();

    return {
      data: rawData,
      count: totalCount,
    };
  }

  public async getNonRejectedQuotations(
    estimateMasterId: number,
  ): Promise<EstimateDetailModel[]> {
    return await this.repository.query(`
      SELECT DISTINCT ESTIMATE_MASTER_ID , VENDOR_ID
      FROM
        ESTIMATE_DETAILS ED
      WHERE
        ESTIMATE_MASTER_ID = ${estimateMasterId}
        AND IS_QUOTE_REJECTED = FALSE
        AND is_send_to_owner = true
        AND is_decline_by_vendor = FALSE
        AND is_estimate_approved = FALSE
      `);
  }

  public async getEstimateByIdForRejection(
    estimate_master_id: number,
    vendor_id: number,
    user: JwtPayload,
  ): Promise<EstimateMasterModel> {
    const baseQueryBuilder = this.repository
      .createQueryBuilder('estimate_masters')
      .where('estimate_masters.id = :estimate_id', {
        estimate_id: estimate_master_id,
      })
      .andWhere('estimate_masters.is_deleted = :isDeleted', {
        isDeleted: false,
      })
      .andWhere('estimate_masters.franchise_id = :franchise_id', {
        franchise_id: Number(user.franchise_id),
      });

    baseQueryBuilder
      .leftJoinAndSelect('estimate_masters.propertyMaster', 'propertyMaster')
      .leftJoinAndSelect('estimate_masters.vendor', 'vendor')
      .leftJoinAndSelect('estimate_masters.owner', 'owner')
      .leftJoinAndSelect('propertyMaster.owner', 'propertyOwner')
      .leftJoinAndSelect('estimate_masters.serviceType', 'serviceType')
      .leftJoinAndSelect(
        'serviceType.serviceTypeCategory',
        'serviceTypeCategory',
      );

    if (vendor_id) {
      baseQueryBuilder.leftJoinAndSelect(
        'estimate_masters.estimateDetail',
        'estimateDetail',
        'estimateDetail.estimate_master_id = :estimate_id AND estimateDetail.franchise_admin_id IS NOT NULL AND estimateDetail.is_send_to_owner = :isSendToOwner AND estimateDetail.vendor_id = :vendor_id',
        {
          estimate_id: estimate_master_id,
          isSendToOwner: true,
          vendor_id,
        },
      );
    } else {
      baseQueryBuilder.leftJoinAndSelect(
        'estimate_masters.estimateDetail',
        'estimateDetail',
        'estimateDetail.estimate_master_id = :estimate_id AND estimateDetail.franchise_admin_id IS NOT NULL AND estimateDetail.is_send_to_owner = :isSendToOwner',
        {
          estimate_id: estimate_master_id,
          isSendToOwner: true,
        },
      );
    }

    return await baseQueryBuilder.getOne();
  }

  public async getApprovedQuotationById(
    estimate_master_id: number,
    user: JwtPayload,
  ): Promise<EstimateMasterModel> {
    const baseQueryBuilder = this.repository
      .createQueryBuilder('estimate_masters')
      .where('estimate_masters.id = :estimate_id', {
        estimate_id: estimate_master_id,
      })
      .andWhere('estimate_masters.is_deleted = :isDeleted', {
        isDeleted: false,
      })
      .andWhere('estimate_masters.franchise_id = :franchise_id', {
        franchise_id: Number(user.franchise_id),
      })
      .andWhere('estimate_masters.status = :status', {
        status: EstimateStatus.EstimateApprovedByOwner,
      })
      .leftJoinAndSelect('estimate_masters.vendor', 'vendor')
      .leftJoinAndSelect('estimate_masters.owner', 'owner')
      .leftJoinAndSelect('estimate_masters.propertyMaster', 'propertyMaster')
      .leftJoinAndSelect('estimate_masters.serviceType', 'serviceType')
      .leftJoinAndSelect(
        'serviceType.serviceTypeCategory',
        'serviceTypeCategory',
      )
      .leftJoinAndSelect(
        'estimate_masters.estimateDetail',
        'estimateDetail',
        'estimateDetail.estimate_master_id = :estimate_id AND estimateDetail.is_estimate_approved = :isEstimateApproved AND estimateDetail.franchise_admin_id IS NOT NULL',
        {
          estimate_id: estimate_master_id,
          isEstimateApproved: true,
        },
      )
      .leftJoinAndSelect('estimateDetail.estimateVendor', 'estimateVendor')
      .leftJoinAndSelect(
        'estimate_masters.estimateDescription',
        'estimateDescription',
        'estimateDescription.estimate_master_id = :estimate_id AND estimateDescription.is_estimate_reject_description = false',
        { estimate_id: estimate_master_id },
      )
      .leftJoinAndSelect(
        'estimateDescription.estimateDescriptionAddedBy',
        'estimateDescriptionAddedBy',
      );

    return await baseQueryBuilder.getOne();
  }

  public async getEstimateQuotationsById(
    estimateMasterId: number,
    query: IPaginationDBParams,
    user: JwtPayload,
    vendorId?: number,
  ): Promise<{ data: EstimateDetailModel[]; count: number }> {
    const sqlQuery = `SELECT DISTINCT ${[UserType.FranchiseAdmin, UserType.StandardAdmin].includes(user.user_type) ? `ON (ED.VENDOR_ID, ED.ESTIMATE_MASTER_ID)` : ``}
        ED.ID as QUOTE_ID, ED.ESTIMATE_MASTER_ID ,
        ED.VENDOR_ID ,
        CONCAT(U.FIRST_NAME, ' ', U.LAST_NAME) AS VENDOR_NAME ,
        ED.PRICE ,
        ED.IS_GRAND_TOTAL,
        UD.DESCRIPTION AS VENDOR_DESC ,
        ED.FRANCHISE_ADMIN_ID,
        ED.IS_SEND_TO_OWNER ,
        ED.IS_ESTIMATE_APPROVED ,
        TO_CHAR(to_timestamp(EM.CREATED_AT), 'MM-DD-YYYY') AS CREATED_AT,
        CASE 
          WHEN ED.IS_ESTIMATE_APPROVED = FALSE AND ED.IS_SEND_TO_OWNER = TRUE AND ED.IS_QUOTE_REJECTED = FALSE THEN ${QuoteStatus.PendingOwnerApproval}
          WHEN ED.IS_ESTIMATE_APPROVED = TRUE AND ED.IS_SEND_TO_OWNER = TRUE AND ED.IS_QUOTE_REJECTED = FALSE THEN ${QuoteStatus.QuoteAccepted}
          WHEN ED.IS_ESTIMATE_APPROVED = FALSE AND ED.IS_SEND_TO_OWNER = TRUE AND ED.IS_QUOTE_REJECTED = TRUE THEN ${QuoteStatus.QuoteRejected}
          ${[UserType.FranchiseAdmin, UserType.StandardAdmin].includes(user.user_type) ? `WHEN ED.IS_ESTIMATE_APPROVED = FALSE AND ED.IS_SEND_TO_OWNER = FALSE AND ED.IS_QUOTE_REJECTED = TRUE THEN ${QuoteStatus.QuoteRejected}` : ''} 
          ${[UserType.FranchiseAdmin, UserType.StandardAdmin].includes(user.user_type) ? `WHEN ED.IS_ESTIMATE_APPROVED = FALSE AND ED.IS_SEND_TO_OWNER = FALSE AND ED.IS_QUOTE_REJECTED = FALSE ${[UserType.FranchiseAdmin, UserType.StandardAdmin].includes(user.user_type) ? `` : `AND ED.FRANCHISE_ADMIN_ID IS NULL`} THEN ${QuoteStatus.QuoteReceived}` : ``} 
        END AS STATUS
      FROM
        ESTIMATE_DETAILS ED
      LEFT JOIN ESTIMATE_MASTERS EM 
      ON
        EM.ID = ED.ESTIMATE_MASTER_ID
      LEFT JOIN USER_DESCRIPTIONS UD 
      ON UD.ESTIMATE_MASTER_ID = ED.ESTIMATE_MASTER_ID
          AND UD.USER_ID = ED.VENDOR_ID
          AND UD.IS_ESTIMATE_REJECT_DESCRIPTION = FALSE
      LEFT JOIN USERS U 
      ON U.ID = ED.VENDOR_ID
      WHERE
        ED.ESTIMATE_MASTER_ID = ${estimateMasterId}
        ${vendorId ? `AND ED.VENDOR_ID = ${vendorId}` : ''}
        AND ED.IS_GRAND_TOTAL = TRUE
        ${
          user.user_type === UserType.Owner
            ? `
          AND ED.FRANCHISE_ADMIN_ID IS NOT NULL
          AND ED.IS_SEND_TO_OWNER = TRUE`
            : ``
        }
        ${
          [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
            user.user_type,
          )
            ? `ORDER BY ED.VENDOR_ID, ED.ESTIMATE_MASTER_ID, (ED.FRANCHISE_ADMIN_ID IS NULL), ED.ID DESC`
            : `ORDER BY ED.ESTIMATE_MASTER_ID DESC`
        }`;

    const countQuery = `SELECT COUNT(*) FROM (${sqlQuery}) AS subquery`;

    const data = await this.repository.query(
      `${sqlQuery} LIMIT ${query?.limit} OFFSET ${query?.offset}`,
    );
    const [{ count }] = await this.repository.query(countQuery);

    return { data, count: Number(count) };
  }

  public async getEstimateStatusForVendor(
    estimateId: number,
    user: JwtPayload,
  ): Promise<any> {
    return await this.repository.query(
      `SELECT 
        COALESCE((
          SELECT 
            CASE 
              WHEN ED.IS_ESTIMATE_APPROVED = FALSE AND ED.IS_SEND_TO_OWNER = FALSE AND ED.IS_QUOTE_REJECTED = FALSE THEN '${EstimateVendorStatus.Quoted}'
              WHEN ED.IS_ESTIMATE_APPROVED = TRUE AND ED.IS_SEND_TO_OWNER = TRUE AND ED.IS_QUOTE_REJECTED = FALSE THEN '${EstimateVendorStatus.QuoteAccepted}'
              WHEN ED.IS_ESTIMATE_APPROVED = FALSE AND ED.IS_SEND_TO_OWNER = TRUE AND ED.IS_QUOTE_REJECTED = TRUE THEN '${EstimateVendorStatus.Reject}'
              ELSE '3'
            END AS STATUS
          FROM ESTIMATE_DETAILS ED
          LEFT JOIN ESTIMATE_MASTERS EM 
            ON EM.ID = ED.ESTIMATE_MASTER_ID
          LEFT JOIN USER_DESCRIPTIONS UD 
            ON UD.ESTIMATE_MASTER_ID = ED.ESTIMATE_MASTER_ID
            AND UD.USER_ID = ED.VENDOR_ID
            AND UD.IS_ESTIMATE_REJECT_DESCRIPTION = FALSE
          WHERE ED.ESTIMATE_MASTER_ID = ${estimateId}
            AND ED.vendor_id = ${user.id}
          ORDER BY ED.ESTIMATE_MASTER_ID DESC
          LIMIT 1
        ), '${EstimateVendorStatus.NotYetQuoted}') AS STATUS`,
    );
  }

  public async getVendorEstimatesV2(
    query: IPaginationDBParams,
    queryParams: EstimateQueryDto,
    user: JwtPayload,
  ): Promise<any> {
    const sqlQuery = `SELECT
        EM.ID AS ESTIMATE_MASTERS_ID,
        TO_CHAR(EM.START_DATE, 'MM-DD-YYYY') AS START_DATE,
        P.ADDRESS AS PROPERTY_ADDRESS,
        ST.TITLE AS SERVICE_TYPE,
        '${EstimateVendorStatus.NotYetQuoted}' AS STATUS,
        TO_CHAR(to_timestamp(EM.created_at), 'MM-DD-YYYY') AS created_at
      FROM
        ESTIMATE_MASTERS EM
      LEFT JOIN PROPERTY_MASTERS P ON
        P.ID = EM.PROPERTY_MASTER_ID
      LEFT JOIN SERVICE_TYPES ST ON
        ST.ID = EM.SERVICE_TYPE_ID
      LEFT JOIN VENDOR_SERVICE_TYPES VST ON
        VST.SERVICE_TYPE_ID = ST.ID
        AND VST.VENDOR_ID = ${user.id}
      LEFT JOIN USERS V ON
        V.ID = VST.VENDOR_ID
      WHERE
        EM.FRANCHISE_ID = ${user.franchise_id}
        AND EM.IS_DELETED = FALSE
        AND V.IS_APPROVED = TRUE
        ${queryParams?.start_date && queryParams?.end_date ? `AND EM.START_DATE >= '${queryParams?.start_date}' AND EM.START_DATE <= '${queryParams?.end_date}'` : ''}
        ${queryParams?.query ? `AND P.ADDRESS ILIKE '%${queryParams?.query}%'` : ''}
        AND EM.STATUS::TEXT NOT IN ('${EstimateStatus.EstimateApprovedByOwner}', '${EstimateStatus.EstimateRejectedByOwner}')
        AND (
                (EM.ESTIMATE_DISTRIBUTION_TYPE::TEXT = '${DistributionType.DistributeToAllVendors}'
          AND NOT EXISTS (
          SELECT
            1
          FROM
            ESTIMATE_DETAILS ED
          WHERE
            ED.ESTIMATE_MASTER_ID = EM.ID
            AND ED.VENDOR_ID = ${user.id}
                ))
        OR (EM.ESTIMATE_DISTRIBUTION_TYPE::TEXT = '${DistributionType.SelectedVendor}'
          AND EM.VENDOR_ID = ${user.id}
          AND EM.STATUS::TEXT = '${EstimateStatus.EstimateVendorAssignment}')
        OR (EM.ESTIMATE_DISTRIBUTION_TYPE::TEXT = '${DistributionType.PreferredVendor}'
          AND EXISTS (
          SELECT
            1
          FROM
            VENDOR_SERVICE_TYPE_PRIORITIES VSTP
          WHERE
            VSTP.VENDOR_ID = ${user.id}
            AND VSTP.PROPERTY_MASTER_ID = EM.PROPERTY_MASTER_ID
            AND VSTP.SERVICE_TYPE_ID = EM.SERVICE_TYPE_ID
                )
          AND NOT EXISTS (
          SELECT
            1
          FROM
            ESTIMATE_DETAILS ED
          WHERE
            ED.ESTIMATE_MASTER_ID = EM.ID
            AND ED.VENDOR_ID = ${user.id}
                ))
        OR (EM.ESTIMATE_DISTRIBUTION_TYPE::TEXT = '${DistributionType.MultipleVendors}'
          AND EXISTS (
          SELECT
            1
          FROM
            ESTIMATE_VENDOR_DISTRIBUTIONS EVD
          WHERE
            EVD.VENDOR_ID = ${user.id}
            AND EVD.PROPERTY_MASTER_ID = EM.PROPERTY_MASTER_ID
            AND EVD.ESTIMATE_MASTER_ID = EM.ID
                )
          AND NOT EXISTS (
          SELECT
            1
          FROM
            ESTIMATE_DETAILS ED
          WHERE
            ED.ESTIMATE_MASTER_ID = EM.ID
            AND ED.VENDOR_ID = ${user.id}
                ))
              )
        AND VST.ID IS NOT NULL
      UNION
      SELECT
        DISTINCT
        ED.ESTIMATE_MASTER_ID AS ESTIMATE_MASTERS_ID,
        TO_CHAR(EM.START_DATE, 'MM-DD-YYYY') AS START_DATE,
        PM.ADDRESS AS PROPERTY_ADDRESS,
        ST.TITLE AS SERVICE_TYPE,
        CASE
          WHEN ED.IS_ESTIMATE_APPROVED = FALSE
          AND ED.IS_QUOTE_REJECTED = FALSE THEN '${EstimateVendorStatus.Quoted}'
          WHEN ED.IS_ESTIMATE_APPROVED = TRUE
          AND ED.IS_QUOTE_REJECTED = FALSE THEN '${EstimateVendorStatus.QuoteAccepted}'
          WHEN ED.IS_ESTIMATE_APPROVED = FALSE
          AND ED.IS_QUOTE_REJECTED = TRUE THEN '${EstimateVendorStatus.Reject}'
          WHEN ED.IS_ESTIMATE_APPROVED = FALSE
          AND ED.IS_QUOTE_REJECTED = FALSE THEN '${EstimateVendorStatus.Quoted}'
        END AS STATUS,
        TO_CHAR(to_timestamp(EM.created_at), 'MM-DD-YYYY') AS created_at
      FROM
        ESTIMATE_DETAILS ED
      LEFT JOIN ESTIMATE_MASTERS EM 
        ON
        EM.ID = ED.ESTIMATE_MASTER_ID
      LEFT JOIN PROPERTY_MASTERS PM 
        ON
        EM.PROPERTY_MASTER_ID = PM.ID
      LEFT JOIN SERVICE_TYPES ST
        ON
        EM.SERVICE_TYPE_ID = ST.ID
      LEFT JOIN USER_DESCRIPTIONS UD 
        ON
        UD.ESTIMATE_MASTER_ID = ED.ESTIMATE_MASTER_ID
        AND UD.USER_ID = ED.VENDOR_ID
        AND UD.IS_ESTIMATE_REJECT_DESCRIPTION = FALSE
      WHERE
        ED.VENDOR_ID = ${user.id}
        AND ED.IS_GRAND_TOTAL = TRUE
        ${queryParams?.start_date && queryParams?.end_date ? `AND EM.START_DATE >= '${queryParams?.start_date}' AND EM.START_DATE <= '${queryParams?.end_date}'` : ''}
        ${queryParams?.query ? `AND PM.ADDRESS ILIKE '%${queryParams?.query}%'` : ''}
        AND ED.FRANCHISE_ADMIN_ID IS NULL`;

    // Add sorting logic
    let orderByClause = '';
    if (query?.sort_by && query?.sort_order) {
      let sortField = 'ESTIMATE_MASTERS_ID';
      if (query.sort_by === 'address') {
        sortField = 'PROPERTY_ADDRESS';
      } else if (query.sort_by === 'service_type') {
        sortField = 'SERVICE_TYPE';
      } else if (query.sort_by === 'start_date') {
        sortField = 'START_DATE';
      } else if (query.sort_by === 'created_at') {
        sortField = 'CREATED_AT';
      }
      orderByClause = `ORDER BY ${sortField} ${query.sort_order === 'asc' ? 'ASC' : 'DESC'}`;
    } else {
      orderByClause = 'ORDER BY ESTIMATE_MASTERS_ID DESC';
    }

    const finalQuery = sqlQuery + ' ' + orderByClause;

    const countQuery = `SELECT COUNT(*) FROM (${finalQuery}) AS subquery`;

    const data = await this.repository.query(
      `${finalQuery} LIMIT ${query?.limit} OFFSET ${query?.offset}`,
    );
    const [{ count }] = await this.repository.query(countQuery);

    return { data, count: Number(count) };
  }

  public async getEstimatesV2(
    query: IPaginationDBParams,
    queryParams: EstimateQueryDto,
    user: JwtPayload,
  ): Promise<any> {
    const sqlQuery = `SELECT EM.ID, TO_CHAR(EM.START_DATE, 'MM-DD-YYYY') AS START_DATE, PM.ADDRESS, ST.TITLE, TO_CHAR(to_timestamp(EM.CREATED_AT), 'MM-DD-YYYY') AS CREATED_AT, EM.STATUS, PM.PROPERTY_NICK_NAME,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM ESTIMATE_DETAILS ED
            WHERE ed.estimate_master_id = EM.ID
              AND ED.IS_SEND_TO_OWNER = TRUE
              AND ED.IS_ESTIMATE_APPROVED = TRUE
        ) THEN '${EstimateOwnerStatus.QuoteAccepted}'
        WHEN EXISTS (
            SELECT 1 FROM ESTIMATE_DETAILS ED
            WHERE ed.estimate_master_id = EM.ID
              AND ED.IS_SEND_TO_OWNER = TRUE
              AND ED.IS_ESTIMATE_APPROVED = FALSE
        ) THEN '${EstimateOwnerStatus.QuoteRecieved}'
        WHEN EXISTS (
            SELECT 1 FROM ESTIMATE_DETAILS ED
            WHERE ed.estimate_master_id = EM.ID
              AND ED.IS_SEND_TO_OWNER = false
              AND ED.is_quote_rejected = FALSE
              AND ED.IS_ESTIMATE_APPROVED = FALSE
        ) THEN '${EstimateOwnerStatus.AwaitingVendorQuote}'
        WHEN EXISTS (
            SELECT 1 FROM ESTIMATE_DETAILS ED
            WHERE ed.estimate_master_id = EM.ID
              AND ED.IS_SEND_TO_OWNER = TRUE
              AND ED.is_quote_rejected = TRUE
              AND ED.IS_ESTIMATE_APPROVED = FALSE
        ) THEN '${EstimateOwnerStatus.Reject}'
        WHEN NOT EXISTS (
            SELECT 1 FROM ESTIMATE_DETAILS ED
            WHERE ed.estimate_master_id = EM.ID
        ) THEN CASE 
                WHEN EM.STATUS = '${EstimateStatus.EstimateRequestedByOwner}' 
                THEN '${EstimateOwnerStatus.UnAssigned}' 
                ELSE '${EstimateOwnerStatus.AwaitingVendorQuote}'
                END
        ELSE 'N/A'
        END AS QUOTE_STATUS
        FROM ESTIMATE_MASTERS EM
        LEFT JOIN PROPERTY_MASTERS PM 
            ON PM.ID = EM.PROPERTY_MASTER_ID
        LEFT JOIN SERVICE_TYPES ST 
            ON ST.ID = EM.SERVICE_TYPE_ID
        WHERE EM.FRANCHISE_ID = ${user.franchise_id}
        ${user.user_type === UserType.Owner ? `AND EM.OWNER_ID = ${user.id}` : ``} 
        ${queryParams?.service_type_id ? `AND EM.SERVICE_TYPE_ID = ${queryParams?.service_type_id}` : ''}
        ${queryParams?.property_master_id ? `AND EM.PROPERTY_MASTER_ID = ${queryParams?.property_master_id}` : ''}
        ${queryParams?.start_date && queryParams?.end_date ? `AND EM.START_DATE >= '${queryParams?.start_date}' AND EM.START_DATE <= '${queryParams?.end_date}'` : ''}
        ${queryParams?.query ? `AND PM.ADDRESS ILIKE '%${queryParams?.query}%' OR PM.PROPERTY_NICK_NAME ILIKE '%${queryParams?.query}%'` : ''}`;

    // Add sorting logic
    let orderByClause = '';
    if (query?.sort_by) {
      let sortField = 'EM.ID';
      if (query.sort_by === 'address') {
        sortField = 'PM.ADDRESS';
      } else if (query.sort_by === 'title') {
        sortField = 'ST.TITLE';
      } else if (query.sort_by === 'start_date') {
        sortField = 'EM.START_DATE';
      } else if (query.sort_by === 'created_at') {
        sortField = 'EM.CREATED_AT';
      } else if (query.sort_by === 'quote_status') {
        sortField = 'QUOTE_STATUS';
      }
      orderByClause = `ORDER BY ${sortField} ${query.sort_order === 'asc' ? 'ASC' : 'DESC'}`;
    } else {
      orderByClause = 'ORDER BY EM.ID DESC';
    }

    const finalQuery = sqlQuery + ' ' + orderByClause;

    const countQuery = `SELECT COUNT(*) FROM (${finalQuery}) AS subquery`;

    const data = await this.repository.query(
      `${finalQuery} LIMIT ${query?.limit} OFFSET ${query?.offset}`,
    );
    const [{ count }] = await this.repository.query(countQuery);

    return { data, count: Number(count) };
  }

  public async approveVendorEstimateDetail(
    queryRunner: QueryRunner,
    estimateMasterId: number,
    vendorId: number,
  ) {
    return await queryRunner.query(
      `
      UPDATE estimate_details
      SET is_quote_rejected = CASE
            WHEN vendor_id != $1 THEN true
            WHEN vendor_id = $1 THEN false
          END,
          is_estimate_approved = CASE
            WHEN vendor_id = $1 THEN true
            ELSE is_estimate_approved
          END
      WHERE estimate_master_id = $2
      `,
      [vendorId, estimateMasterId],
    );
  }

  async getVendorNotYetQuotedEstimatesCount(user: JwtPayload): Promise<number> {
    const sqlQuery = `SELECT COUNT(*) FROM (
      SELECT
        EM.ID AS ESTIMATE_MASTERS_ID
      FROM
        ESTIMATE_MASTERS EM
      LEFT JOIN PROPERTY_MASTERS P ON
        P.ID = EM.PROPERTY_MASTER_ID
      LEFT JOIN SERVICE_TYPES ST ON
        ST.ID = EM.SERVICE_TYPE_ID
      LEFT JOIN VENDOR_SERVICE_TYPES VST ON
        VST.SERVICE_TYPE_ID = ST.ID
        AND VST.VENDOR_ID = ${user.id}
      LEFT JOIN USERS V ON
        V.ID = VST.VENDOR_ID
      WHERE
        EM.FRANCHISE_ID = ${user.franchise_id}
        AND EM.IS_DELETED = FALSE
        AND V.IS_APPROVED = TRUE
        AND EM.STATUS::TEXT NOT IN ('${EstimateStatus.EstimateApprovedByOwner}', '${EstimateStatus.EstimateRejectedByOwner}')
        AND (
                (EM.ESTIMATE_DISTRIBUTION_TYPE::TEXT = '${DistributionType.DistributeToAllVendors}'
          AND NOT EXISTS (
          SELECT
            1
          FROM
            ESTIMATE_DETAILS ED
          WHERE
            ED.ESTIMATE_MASTER_ID = EM.ID
            AND ED.VENDOR_ID = ${user.id}
                ))
        OR (EM.ESTIMATE_DISTRIBUTION_TYPE::TEXT = '${DistributionType.SelectedVendor}'
          AND EM.VENDOR_ID = ${user.id}
          AND EM.STATUS::TEXT = '${EstimateStatus.EstimateVendorAssignment}')
        OR (EM.ESTIMATE_DISTRIBUTION_TYPE::TEXT = '${DistributionType.PreferredVendor}'
          AND EXISTS (
          SELECT
            1
          FROM
            VENDOR_SERVICE_TYPE_PRIORITIES VSTP
          WHERE
            VSTP.VENDOR_ID = ${user.id}
            AND VSTP.PROPERTY_MASTER_ID = EM.PROPERTY_MASTER_ID
            AND VSTP.SERVICE_TYPE_ID = EM.SERVICE_TYPE_ID
                )
          AND NOT EXISTS (
          SELECT
            1
          FROM
            ESTIMATE_DETAILS ED
          WHERE
            ED.ESTIMATE_MASTER_ID = EM.ID
            AND ED.VENDOR_ID = ${user.id}
                ))
        OR (EM.ESTIMATE_DISTRIBUTION_TYPE::TEXT = '${DistributionType.MultipleVendors}'
          AND EXISTS (
          SELECT
            1
          FROM
            ESTIMATE_VENDOR_DISTRIBUTIONS EVD
          WHERE
            EVD.VENDOR_ID = ${user.id}
            AND EVD.PROPERTY_MASTER_ID = EM.PROPERTY_MASTER_ID
            AND EVD.ESTIMATE_MASTER_ID = EM.ID
                )
          AND NOT EXISTS (
          SELECT
            1
          FROM
            ESTIMATE_DETAILS ED
          WHERE
            ED.ESTIMATE_MASTER_ID = EM.ID
            AND ED.VENDOR_ID = ${user.id}
                ))
              )
        AND VST.ID IS NOT NULL
    ) AS subquery`;

    const [{ count }] = await this.repository.query(sqlQuery);
    return Number(count);
  }
}

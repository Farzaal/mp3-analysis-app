import { PaginationParam } from '@/app/commons/base.request';
import { MemberShipStatus } from '@/app/contracts/enums/membership.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  ValidateNested,
  IsInt,
  IsNumber,
  Min,
  IsOptional,
  IsNotEmptyObject,
  IsEnum,
  ValidateIf,
  IsArray,
} from 'class-validator';

export class CreateMembershipDto {
  @ApiProperty()
  @ValidateIf((o) => o.membership_type === MemberShipStatus.Paid)
  @Type(() => Number)
  @IsNotEmpty({ message: 'Price is required' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Membership type is required' })
  @Type(() => Number)
  @IsEnum(MemberShipStatus)
  membership_type: MemberShipStatus;

  @ApiProperty()
  @IsNotEmpty({ message: 'Property master ID is required' })
  @Type(() => Number)
  @IsNumber()
  property_master_id: number;
}

export class CreatePropertyMaintenanceDetailDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  air_filters: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  storm_preparation_instructions: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  emergency_procedures: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  heating_cooling_system_type: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  heating_cooling_system_info: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  water_shutoff: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  bulb_type_preference: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  water_heater: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  water_heater_location: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  preventive_maintenance_instructions: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  breaker_box_location: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  microwave_info: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  stove_info: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  dishwasher_info: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  washer_info: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  dryer_info: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  refrigerator_info: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  other_info: string;
}

export class CreatePropertyCleaningDetailDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Number of bedrooms is required' })
  @IsNumber()
  number_of_bedrooms: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Number of baths is required' })
  @IsNumber()
  number_of_baths: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Number of king beds is required' })
  @IsNumber()
  number_of_king_beds: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Number of queen beds is required' })
  @IsNumber()
  number_of_queen_beds: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Number of full beds is required' })
  @IsNumber()
  number_of_full_beds: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Number of twin beds is required' })
  @IsNumber()
  number_of_twin_beds: number;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  guest_sleeping_capacity: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  cleaning_team_instruction: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  location_of_dumpster?: string;
}

export class CreatePropertyInfoDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  lock_brand_required_battery_type: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  property_nick_name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Address is required' })
  @IsString()
  address: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'City is required' })
  @IsNumber()
  city: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'State is required' })
  @IsString()
  state: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  alternate_contact_name: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  zip: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  alternate_contact_phone: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  parking_details: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  alarm_system: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  front_door_lock_type: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  community_gate_code: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  door_code: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  lock_box_code: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  supply_closet_code: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  supply_closet_location: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  storage_room_code: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  vrbo_number: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  smart_home_devices: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  airbnb_number: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  isp_info: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  wifi_network: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  wifi_router_location: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  wifi_password: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  account_name_is_in: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  account_phone_number: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  account_code: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  heated_sq_ft: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  hoa_management_info: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  other_management_company: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  pool_hot_tub: string;
}

export class CreatePropertyDto {
  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested({ each: true })
  @Type(() => CreatePropertyInfoDto)
  property_info: CreatePropertyInfoDto;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested({ each: true })
  @Type(() => CreatePropertyCleaningDetailDto)
  property_cleaning_info: CreatePropertyCleaningDetailDto;

  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => CreatePropertyMaintenanceDetailDto)
  property_maintenance_info: CreatePropertyMaintenanceDetailDto;
}

export class OffProgramDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Off program status is required' })
  @IsBoolean()
  off_program: boolean;
}

export class PropertySearchDto extends PaginationParam {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  service_area: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  membership_tier: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  owner_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  off_program: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  download: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  payment_methods: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isReport: boolean;
}

export class VendorPreferenceDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service type ID is required' })
  @IsNumber()
  service_type_id: number;

  @ApiProperty({ required: true, type: [Number] })
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsNumber({}, { each: true })
  vendors: number[];
}

export class CreatePreferredVendorDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Property master ID is required' })
  @IsNumber()
  property_master_id: number;

  @ApiProperty({ required: true, type: [VendorPreferenceDto] })
  @IsArray()
  @IsNotEmpty({ message: 'Preferences are required' })
  preferences: VendorPreferenceDto[];
}

export class GetPreferredVendorCountDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Property master ID is required' })
  @IsNumber()
  @Type(() => Number)
  property_master_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service type ID is required' })
  @IsNumber()
  @Type(() => Number)
  service_type_id: number;
}

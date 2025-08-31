// import { Test, TestingModule } from '@nestjs/testing';
// import { OwnerService } from './owner.service';
// import { UserRepository } from '@/app/repositories/user/user.repository';
// import { PaymentService } from '@/payment/payment.service';
// import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
// import { BadRequestException } from '@nestjs/common';
// import { CreateOwnerDto, UpdateOwnerDto } from './owner.dto';
// import { UserModel } from '@/app/models/user/user.model';
// import { FranchiseModel } from '@/app/models/franchise/franchise.model';
// import { OwnerMessages } from './owner.message';
// import { OwnerProfileStatus } from '@/app/contracts/enums/ownerProfile.enum';
// import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
// import {
//   createOwner,
//   owner,
//   updateOwner,
//   JWTPayload,
// } from './testData/owner.mock';

// describe('OwnerService', () => {
//   let service: OwnerService;

//   const mockUserRepository = {
//     findOne: jest.fn(),
//     save: jest.fn(),
//     update: jest.fn(),
//   };

//   const mockPaymentService = {
//     createStripeCustomer: jest.fn(),
//   };

//   const mockFranchiseRepository = {
//     findOne: jest.fn(),
//   };

//   const mockUserModel = new UserModel();
//   mockUserModel.id = owner.id;
//   mockUserModel.email = owner.email;
//   mockUserModel.first_name = owner.first_name;
//   mockUserModel.last_name = owner.last_name;
//   mockUserModel.cell_phone = owner.cell_phone;
//   mockUserModel.franchise_id = owner.franchise_id;
//   mockUserModel.profile_completion_step = OwnerProfileStatus.ProfileCompleted;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         OwnerService,
//         { provide: UserRepository, useValue: mockUserRepository },
//         { provide: PaymentService, useValue: mockPaymentService },
//         { provide: FranchiseRepository, useValue: mockFranchiseRepository },
//       ],
//     }).compile();

//     service = module.get<OwnerService>(OwnerService);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('createOwnerProfile', () => {
//     it('should create an owner profile successfully', async () => {
//       const createOwnerDto: CreateOwnerDto = {
//         first_name: createOwner.first_name,
//         last_name: createOwner.last_name,
//         franchise_site_id: createOwner.franchise_site_id,
//         email: createOwner.email,
//         phone: createOwner.phone,
//         password: createOwner.password,
//       };

//       const franchiseModel = new FranchiseModel();
//       franchiseModel.id = 1;

//       mockFranchiseRepository.findOne.mockResolvedValue(franchiseModel);
//       mockUserRepository.findOne.mockResolvedValue(null);
//       mockPaymentService.createStripeCustomer.mockResolvedValue({
//         id: 'stripe_customer_id',
//       });
//       mockUserRepository.save.mockResolvedValue(mockUserModel);

//       const result = await service.createOwnerProfile(createOwnerDto);
//       expect(result).toEqual(mockUserModel);
//       expect(mockFranchiseRepository.findOne).toHaveBeenCalledWith({
//         where: { franchise_site_id: createOwnerDto.franchise_site_id },
//       });
//       expect(mockUserRepository.findOne).toHaveBeenCalledWith({
//         where: { email: createOwnerDto.email },
//       });
//       expect(mockPaymentService.createStripeCustomer).toHaveBeenCalledWith(
//         createOwnerDto.first_name,
//         createOwnerDto.email,
//       );
//       expect(mockUserRepository.save).toHaveBeenCalledWith(
//         expect.any(UserModel),
//       );
//     });

//     it('should throw BadRequestException if franchise does not exist', async () => {
//       const createOwnerDto: CreateOwnerDto = {
//         first_name: createOwner.first_name,
//         last_name: createOwner.last_name,
//         franchise_site_id: createOwner.franchise_site_id,
//         email: createOwner.email,
//         phone: createOwner.phone,
//         password: createOwner.password,
//       };

//       mockFranchiseRepository.findOne.mockResolvedValue(null);

//       await expect(service.createOwnerProfile(createOwnerDto)).rejects.toThrow(
//         new BadRequestException(OwnerMessages.FRANCHISE_NOT_EXISTS),
//       );
//     });

//     it('should throw BadRequestException if email already exists', async () => {
//       const createOwnerDto: CreateOwnerDto = {
//         first_name: createOwner.first_name,
//         last_name: createOwner.last_name,
//         franchise_site_id: createOwner.franchise_site_id,
//         email: createOwner.email,
//         phone: createOwner.phone,
//         password: createOwner.password,
//       };

//       const franchiseModel = new FranchiseModel();
//       franchiseModel.id = 1;

//       mockFranchiseRepository.findOne.mockResolvedValue(franchiseModel);
//       mockUserRepository.findOne.mockResolvedValue(mockUserModel);

//       await expect(service.createOwnerProfile(createOwnerDto)).rejects.toThrow(
//         new BadRequestException(OwnerMessages.OWNER_EMAIL_EXITSTS),
//       );
//     });

//     it('should throw BadRequestException if customer creation fails', async () => {
//       const createOwnerDto: CreateOwnerDto = {
//         first_name: createOwner.first_name,
//         last_name: createOwner.last_name,
//         franchise_site_id: createOwner.franchise_site_id,
//         email: createOwner.email,
//         phone: createOwner.phone,
//         password: createOwner.password,
//       };

//       const franchiseModel = new FranchiseModel();
//       franchiseModel.id = 1;

//       mockFranchiseRepository.findOne.mockResolvedValue(franchiseModel);
//       mockUserRepository.findOne.mockResolvedValue(null);
//       mockPaymentService.createStripeCustomer.mockResolvedValue(null);

//       await expect(service.createOwnerProfile(createOwnerDto)).rejects.toThrow(
//         new BadRequestException(OwnerMessages.CUSTOMER_CREATION_ERROR),
//       );
//     });
//   });

//   describe('updateOwnerProfile', () => {
//     it('should update an owner profile successfully', async () => {
//       const updateOwnerDto: UpdateOwnerDto = updateOwner;

//       const userPayload: JwtPayload = JWTPayload;

//       mockUserRepository.findOne.mockResolvedValue(mockUserModel);
//       mockUserRepository.save.mockResolvedValue(mockUserModel);

//       const result = await service.updateOwnerProfile(
//         updateOwnerDto,
//         userPayload,
//       );
//       expect(result).toEqual(mockUserModel);
//       expect(mockUserRepository.findOne).toHaveBeenCalledWith({
//         where: { email: updateOwnerDto.email },
//       });
//       expect(mockUserRepository.save).toHaveBeenCalledWith(
//         expect.any(UserModel),
//       );
//     });

//     it('should throw BadRequestException if user does not exist', async () => {
//       const updateOwnerDto: UpdateOwnerDto = updateOwner;

//       const userPayload: JwtPayload = JWTPayload;

//       mockUserRepository.findOne.mockResolvedValue(null);

//       await expect(
//         service.updateOwnerProfile(updateOwnerDto, userPayload),
//       ).rejects.toThrow(
//         new BadRequestException(OwnerMessages.OWNER_EMAIL_NOT_EXITSTS),
//       );
//     });
//   });

//   describe('updateOwnerProfileCompletionStep', () => {
//     it('should update the profile completion step successfully', async () => {
//       const userPayload: JwtPayload = JWTPayload;

//       const completionStep = OwnerProfileStatus.PaymentMethodAdded;

//       mockUserRepository.findOne.mockResolvedValue(mockUserModel);
//       mockUserRepository.update.mockResolvedValue(undefined);

//       const result = await service.updateOwnerProfileCompletionStep(
//         userPayload,
//         completionStep,
//       );
//       expect(result).toBe(true);
//       expect(mockUserRepository.findOne).toHaveBeenCalledWith({
//         where: { id: userPayload.id },
//       });
//       expect(mockUserRepository.update).toHaveBeenCalledWith(
//         { id: userPayload.id },
//         { profile_completion_step: completionStep },
//       );
//     });

//     it('should return false if user does not exist', async () => {
//       const userPayload: JwtPayload = JWTPayload;

//       const completionStep = OwnerProfileStatus.PaymentMethodAdded;

//       mockUserRepository.findOne.mockResolvedValue(null);

//       const result = await service.updateOwnerProfileCompletionStep(
//         userPayload,
//         completionStep,
//       );
//       expect(result).toBe(false);
//     });

//     it('should return false if profile completion step is already PaymentMethodAdded', async () => {
//       const userPayload: JwtPayload = JWTPayload;

//       const completionStep = OwnerProfileStatus.PaymentMethodAdded;

//       mockUserModel.profile_completion_step =
//         OwnerProfileStatus.PaymentMethodAdded;
//       mockUserRepository.findOne.mockResolvedValue(mockUserModel);

//       const result = await service.updateOwnerProfileCompletionStep(
//         userPayload,
//         completionStep,
//       );
//       expect(result).toBe(false);
//     });
//   });
// });

// import { Test, TestingModule } from '@nestjs/testing';
// import { VendorService } from './vendor.service';
// import { UserRepository } from '@/app/repositories/user/user.repository';
// import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
// import { FranchiseServiceTypeRepository } from '@/app/repositories/serviceType/franchiseServiceType.repository';
// import { FranchiseServiceLocationRepository } from '@/app/repositories/franchise/franchiseServiceLocation.repository';
// import { GeneralHelper } from '@/app/utils/general.helper';
// import { DataSource } from 'typeorm';
// import { BadRequestException } from '@nestjs/common';
// import {
//   CreateVendorDto,
//   // UpdateVendorDto
// } from './vendor.dto';
// import { UserModel } from '@/app/models/user/user.model';
// import {
//   createVendor,
//   vendor,
//   // vendorUpdate
// } from './testData/vendor.mock';
// import { FranchiseModel } from '@/app/models/franchise/franchise.model'; // Add this line
// import { FranchiseServiceLocationModel } from '@/app/models/franchise/franchiseServiceLocation.model';
// import { FranchiseServiceTypeModel } from '@/app/models/serviceType/franchiseServiceType.model';

// describe('VendorService', () => {
//   let vendorService: VendorService;
//   let userRepository: UserRepository;
//   let franchiseRepository: FranchiseRepository;
//   let franchiseServiceTypeRepository: FranchiseServiceTypeRepository;
//   let franchiseServiceLocationRepository: FranchiseServiceLocationRepository;
//   //   let generalHelper: GeneralHelper;

//   const mockUserModel = new UserModel();
//   mockUserModel.id = 1;
//   mockUserModel.email = vendor.email;
//   mockUserModel.first_name = vendor.first_name;
//   mockUserModel.last_name = vendor.last_name;
//   mockUserModel.cell_phone = vendor.cell_phone;
//   mockUserModel.office_phone = vendor.office_phone;
//   mockUserModel.mailing_address = vendor.mailing_address;
//   mockUserModel.city = vendor.city;
//   mockUserModel.state = vendor.state;
//   mockUserModel.zip = vendor.zip;
//   mockUserModel.policy_number = vendor.policy_number;
//   mockUserModel.policy_effective_date = new Date(vendor.policy_effective_date);
//   mockUserModel.policy_expire_date = new Date(vendor.policy_expire_date);
//   mockUserModel.website_url = vendor.website_url;
//   mockUserModel.insurance_company = vendor.insurance_company;
//   mockUserModel.license_number = vendor.license_number;
//   mockUserModel.password = vendor.password;
//   mockUserModel.contact = vendor.contact;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         VendorService,
//         {
//           provide: UserRepository,
//           useValue: {
//             findOne: jest.fn(),
//             create: jest.fn(),
//             save: jest.fn(),
//             getVendors: jest.fn(),
//           },
//         },
//         {
//           provide: FranchiseRepository,
//           useValue: {
//             findOne: jest.fn(),
//           },
//         },
//         {
//           provide: FranchiseServiceTypeRepository,
//           useValue: {
//             find: jest.fn(),
//           },
//         },
//         {
//           provide: FranchiseServiceLocationRepository,
//           useValue: {
//             find: jest.fn(),
//           },
//         },
//         {
//           provide: GeneralHelper,
//           useValue: {
//             getPaginationOptions: jest.fn(),
//           },
//         },
//         {
//           provide: DataSource,
//           useValue: {
//             createQueryRunner: jest.fn(),
//           },
//         },
//         {
//           provide: DataSource,
//           useValue: {
//             createQueryRunner: jest.fn().mockReturnValue({
//               startTransaction: jest.fn(),
//               commitTransaction: jest.fn(),
//               rollbackTransaction: jest.fn(),
//               release: jest.fn(),
//               manager: {
//                 save: jest.fn().mockResolvedValue(createVendor),
//                 create: jest.fn().mockImplementation((data) => {
//                   return { ...data };
//                 }),
//               },
//             }),
//           },
//         },
//       ],
//     }).compile();

//     vendorService = module.get<VendorService>(VendorService);
//     userRepository = module.get<UserRepository>(UserRepository);
//     franchiseRepository = module.get<FranchiseRepository>(FranchiseRepository);
//     franchiseServiceTypeRepository = module.get<FranchiseServiceTypeRepository>(
//       FranchiseServiceTypeRepository,
//     );
//     franchiseServiceLocationRepository =
//       module.get<FranchiseServiceLocationRepository>(
//         FranchiseServiceLocationRepository,
//       );
//     // generalHelper = module.get<GeneralHelper>(GeneralHelper);
//   });

//   // describe('createVendor', () => {
//   //   it('should create a vendor successfully', async () => {
//   //     const payload: CreateVendorDto = createVendor;

//   //     jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
//   //     jest
//   //       .spyOn(franchiseRepository, 'findOne')
//   //       .mockResolvedValue(new FranchiseModel());
//   //     jest
//   //       .spyOn(franchiseServiceTypeRepository, 'find')
//   //       .mockResolvedValue([new FranchiseServiceTypeModel()]);
//   //     jest
//   //       .spyOn(franchiseServiceLocationRepository, 'find')
//   //       .mockResolvedValue([new FranchiseServiceLocationModel()]);
//   //     jest.spyOn(userRepository, 'create').mockReturnValue(mockUserModel);
//   //     jest.spyOn(userRepository, 'save').mockResolvedValue(mockUserModel);

//   //     const result = await vendorService.createVendor(payload);
//   //     expect(result).toMatchObject({
//   //       email: mockUserModel.email,
//   //       first_name: mockUserModel.first_name,
//   //       last_name: mockUserModel.last_name,
//   //       cell_phone: mockUserModel.cell_phone,
//   //       office_phone: mockUserModel.office_phone,
//   //       mailing_address: mockUserModel.mailing_address,
//   //       city: mockUserModel.city,
//   //       state: mockUserModel.state,
//   //       zip: mockUserModel.zip,
//   //       policy_number: mockUserModel.policy_number,
//   //       policy_effective_date: mockUserModel.policy_effective_date,
//   //       policy_expire_date: mockUserModel.policy_expire_date,
//   //       website_url: mockUserModel.website_url,
//   //       insurance_company: mockUserModel.insurance_company,
//   //       license_number: mockUserModel.license_number,
//   //       password: mockUserModel.password,
//   //       contact: mockUserModel.contact,
//   //     });
//   //   });

//   //   it('should throw BadRequestException if vendor already exists', async () => {
//   //     const payload: CreateVendorDto = createVendor;
//   //     const existingUser = new UserModel();
//   //     existingUser.email = payload.email;

//   //     jest.spyOn(userRepository, 'findOne').mockResolvedValue(existingUser);

//   //     await expect(vendorService.createVendor(payload)).rejects.toThrow(
//   //       BadRequestException,
//   //     );
//   //   });

//   //   it('should throw BadRequestException if franchise does not exist', async () => {
//   //     const payload: CreateVendorDto = createVendor;
//   //     jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
//   //     jest.spyOn(franchiseRepository, 'findOne').mockResolvedValue(null);

//   //     await expect(vendorService.createVendor(payload)).rejects.toThrow(
//   //       BadRequestException,
//   //     );
//   //   });
//   // });

//   //   describe('update', () => {
//   //     it('should update a vendor successfully', async () => {
//   //       const payload: UpdateVendorDto = vendorUpdate;

//   //       const user = new UserModel();
//   //       user.id = 1;
//   //       user.franchise_id = 1;

//   //       jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
//   //       jest
//   //         .spyOn(franchiseServiceTypeRepository, 'find')
//   //         .mockResolvedValue([{ id: 1 }]);
//   //       jest
//   //         .spyOn(franchiseServiceLocationRepository, 'find')
//   //         .mockResolvedValue([{ id: 1 }]);
//   //       jest.spyOn(userRepository, 'save').mockResolvedValue(user);

//   //       const result = await vendorService.update(payload, { franchise_id: 1 });
//   //       expect(result).toEqual(user);
//   //     });

//   //     it('should throw BadRequestException if vendor not found', async () => {
//   //       const payload: UpdateVendorDto = vendorUpdate;
//   //       jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

//   //       await expect(
//   //         vendorService.update(payload, { franchise_id: 1 }),
//   //       ).rejects.toThrow(BadRequestException);
//   //     });

//   //     it('should throw BadRequestException if service types are invalid', async () => {
//   //       const payload: UpdateVendorDto = vendorUpdate;
//   //       const user = new UserModel();
//   //       user.id = 1;
//   //       user.franchise_id = 1;

//   //       jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
//   //       jest.spyOn(franchiseServiceTypeRepository, 'find').mockResolvedValue([]);

//   //       await expect(
//   //         vendorService.update(payload, { franchise_id: 1 }),
//   //       ).rejects.toThrow(BadRequestException);
//   //     });

//   //     it('should throw BadRequestException if towns are invalid', async () => {
//   //       const payload: UpdateVendorDto = vendorUpdate;
//   //       const user = new UserModel();
//   //       user.id = 1;
//   //       user.franchise_id = 1;

//   //       jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
//   //       jest
//   //         .spyOn(franchiseServiceTypeRepository, 'find')
//   //         .mockResolvedValue([{ id: 1 }]);
//   //       jest
//   //         .spyOn(franchiseServiceLocationRepository, 'find')
//   //         .mockResolvedValue([]);

//   //       await expect(
//   //         vendorService.update(payload, { franchise_id: 1 }),
//   //       ).rejects.toThrow(BadRequestException);
//   //     });
//   //   });

//   //   describe('getVendors', () => {
//   //     it('should return a paginated list of vendors', async () => {
//   //       const params = {
//   //         /* pagination params */
//   //       };
//   //       const expectedResponse = {
//   //         /* expected response */
//   //       };

//   //       jest.spyOn(generalHelper, 'getPaginationOptions').mockReturnValue(params);
//   //       jest
//   //         .spyOn(userRepository, 'getVendors')
//   //         .mockResolvedValue(expectedResponse);

//   //       const result = await vendorService.getVendors(params);
//   //       expect(result).toEqual(expectedResponse);
//   //     });
//   //   });

//   //   describe('getVendor', () => {
//   //     it('should return a vendor by ID', async () => {
//   //       const vendorId = 1;
//   //       const user = new UserModel();
//   //       user.id = vendorId;

//   //       jest.spyOn(userRepository, 'getVendor').mockResolvedValue(user);

//   //       const result = await vendorService.getVendor(vendorId);
//   //       expect(result).toEqual({ vendor: user });
//   //     });

//   //     it('should throw BadRequestException if vendor not found', async () => {
//   //       const vendorId = 1;
//   //       jest.spyOn(userRepository, 'getVendor').mockResolvedValue(null);

//   //       await expect(vendorService.getVendor(vendorId)).rejects.toThrow(
//   //         BadRequestException,
//   //       );
//   //     });
//   //   });

//   //   describe('updateVendorApproval', () => {
//   //     it('should update vendor approval status', async () => {
//   //       const payload = { vendor_id: 1, is_active: true };
//   //       const user = new UserModel();
//   //       user.id = payload.vendor_id;

//   //       jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
//   //       jest.spyOn(userRepository, 'save').mockResolvedValue(user);

//   //       const result = await vendorService.updateVendorApproval(payload, {
//   //         franchise_id: 1,
//   //       });
//   //       expect(result).toEqual(user);
//   //     });

//   //     it('should throw BadRequestException if vendor not found', async () => {
//   //       const payload = { vendor_id: 1, is_active: true };
//   //       jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

//   //       await expect(
//   //         vendorService.updateVendorApproval(payload, { franchise_id: 1 }),
//   //       ).rejects.toThrow(BadRequestException);
//   //     });
//   //   });
// });

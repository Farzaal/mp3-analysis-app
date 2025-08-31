// import { Test, TestingModule } from '@nestjs/testing';
// import { DataSource } from 'typeorm';
// import { FranchiseService } from './franchise.service';
// import { UserRepository } from '@/app/repositories/user/user.repository';
// import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
// import { FranchiseServiceLocationRepository } from '@/app/repositories/franchise/franchiseServiceLocation.repository';
// import { GeneralHelper } from '@/app/utils/general.helper';
// import { ServiceTypeService } from '@/serviceType/serviceType.service';
// import { CreateFranchiseAdminDto } from './franchise.dto';
// import { AuthMessages } from '@/auth/auth.message';
// import { BadRequestException } from '@nestjs/common';
// import { UserModel } from '@/app/models/user/user.model';

// describe('FranchiseService', () => {
//   let franchiseService: FranchiseService;
//   let userRepository: UserRepository;
//   //   let franchiseRepository: FranchiseRepository;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         FranchiseService,
//         {
//           provide: DataSource,
//           useValue: {
//             createQueryRunner: jest.fn(),
//           },
//         },
//         {
//           provide: UserRepository,
//           useValue: {
//             findOne: jest.fn(),
//             create: jest.fn(),
//             save: jest.fn(),
//           },
//         },
//         {
//           provide: FranchiseRepository,
//           useValue: {
//             findOne: jest.fn(),
//             create: jest.fn(),
//             save: jest.fn(),
//           },
//         },
//         {
//           provide: FranchiseServiceLocationRepository,
//           useValue: {
//             findOne: jest.fn(),
//             create: jest.fn(),
//             save: jest.fn(),
//           },
//         },
//         {
//           provide: GeneralHelper,
//           useValue: {
//             getPaginationOptions: jest.fn(),
//           },
//         },
//         {
//           provide: ServiceTypeService,
//           useValue: {
//             findOne: jest.fn(),
//             create: jest.fn(),
//             save: jest.fn(),
//           },
//         },
//       ],
//     }).compile();

//     franchiseService = module.get<FranchiseService>(FranchiseService);
//     userRepository = module.get<UserRepository>(UserRepository);
//     // franchiseRepository = module.get<FranchiseRepository>(FranchiseRepository);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should throw error if franchise admin already exists', async () => {
//     const payload: CreateFranchiseAdminDto = {
//       email: 'farzaljesttest@gmail.com',
//       password: 'click123',
//       first_name: 'Farzal', // ... existing properties ...
//       last_name: 'Khan',
//       cell_phone: '123-456-7890',
//       office_phone: '123-456-7890',
//       mailing_address: '123 Main St',
//       website_url: 'https://www.example.com',
//       license_number: '1234567890',
//       state: 'CA',
//       franchise_id: 3,
//       zip: '12345',
//       comments: 'Test comment',
//     };
//     jest
//       .spyOn(userRepository, 'findOne')
//       .mockResolvedValueOnce({} as UserModel);

//     await expect(
//       franchiseService.createFranchiseAdmin(payload),
//     ).rejects.toThrow(
//       new BadRequestException(AuthMessages.FRANCHISE_ADMIN_EXISTS),
//     );
//   });
// });

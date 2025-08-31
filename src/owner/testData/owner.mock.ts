import { UserType } from '@/app/contracts/enums/usertype.enum';

export const createOwner = {
  first_name: 'John',
  last_name: 'Doe',
  franchise_site_id: 1,
  email: 'test@example.com',
  phone: '1234567890',
  password: 'password123',
};

export const owner = {
  id: 1,
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  cell_phone: '1234567890',
  franchise_id: 1,
};

export const updateOwner = {
  first_name: 'John',
  last_name: 'Doe',
  franchise_site_id: 1,
  email: 'test@example.com',
  phone: '1234567890',
  password: 'newpassword123',
  mailing_address: '123 Main St',
  city: 'City',
  state: 'State',
  zip: '12345',
  country: 'Country',
};

export const JWTPayload = {
  id: 1,
  email: 'test@example.com',
  user_type: UserType.Owner,
  franchise_id: 1,
};

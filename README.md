# We Oversee Backend API

A comprehensive property management and service request system built with NestJS, TypeORM, and PostgreSQL.

## 🏗️ Project Architecture

This project follows a **layered architecture pattern** with clear separation of concerns:

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Controllers   │  │   DTOs         │  │  Guards     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │    Services     │  │   Utilities     │  │  Helpers    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  Repositories   │  │    Models       │  │  Database   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. **Controllers** (`src/app/controllers/`)
- Handle HTTP requests and responses
- Extend `BaseController` for standardized response handling
- Implement input validation using DTOs
- Apply authentication and authorization guards

#### 2. **Services** (`src/app/services/`)
- Contain business logic and orchestration
- Handle data transformation and validation
- Coordinate between repositories and external services
- Implement caching and business rules

#### 3. **Repositories** (`src/app/repositories/`)
- Extend `BaseRepository<T>` for common CRUD operations
- Handle database queries and data persistence
- Implement pagination, filtering, and sorting
- Manage database transactions

#### 4. **Models** (`src/app/models/`)
- Define database schema using TypeORM decorators
- Extend `PostgresBaseModel` for common fields
- Implement relationships (One-to-Many, Many-to-One, etc.)
- Handle data validation and transformation

## 🗄️ Database & ORM

### TypeORM Configuration
- **Database**: PostgreSQL 15
- **ORM**: TypeORM with NestJS integration
- **Connection**: Async configuration with environment variables
- **Synchronization**: Disabled (manual migrations)

### Base Model Structure
```typescript
// BaseModel (src/app/models/base.model.ts)
export abstract class BaseModel extends BaseEntity {
  @Column({ name: 'created_at', type: 'bigint' })
  created_at: number;

  @Column({ name: 'updated_at', type: 'bigint' })
  updated_at: number;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  is_deleted: boolean;
}

// PostgresBaseModel (src/app/models/postgresBase.model.ts)
export abstract class PostgresBaseModel extends BaseModel {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
  id: number;
}
```

### Key Database Models

#### User Management
- **UserModel**: Core user entity with role-based access control
- **RoleModel**: User roles and permissions
- **PermissionModel**: Granular permissions system

#### Property Management
- **PropertyMasterModel**: Main property information
- **PropertyDetailModel**: Detailed property specifications
- **GuestModel**: Guest information and access

#### Service Management
- **ServiceRequestMasterModel**: Service request lifecycle
- **ServiceTypeModel**: Available service types and pricing
- **VendorServiceTypeModel**: Vendor-service type relationships

#### Financial Management
- **EstimateMasterModel**: Service estimates and quotes
- **ServiceRequestInvoiceModel**: Billing and payment tracking
- **PaymentMethodModel**: Payment method configurations

## 🔐 Authentication & Authorization

### JWT Strategy
- **JWT Secret**: Configurable via environment variables
- **Token Expiry**: 60 minutes
- **Extraction**: Bearer token from Authorization header

### Role-Based Access Control
```typescript
export enum UserType {
  FranchiseAdmin = 1,
  Owner = 2,
  Vendor = 3,
  Guest = 4,
  SuperAdmin = 5,
}
```

### Guards
- **AuthGuard**: JWT token validation and role checking
- **Factory Pattern**: Dynamic guard creation with role requirements

## 📝 Data Validation & Transformation

### DTOs (Data Transfer Objects)
- Input validation using `class-validator`
- Response transformation using `class-transformer`
- Pagination parameters with validation

### Custom Decorators
- **@IsValidDate**: Date format validation
- **Pagination decorators**: Page and limit validation

### Validation Pipes
- Global validation pipe for automatic validation
- Custom exception filter for validation errors

## 🚀 API Documentation

### Swagger Integration
- **Endpoint**: `/api-docs`
- **Title**: We Oversee APIs
- **Version**: 1.0
- **Server**: Local environment configuration

### Response Standards
```typescript
interface IResponseJson {
  message: string;
  data: any;
  code: number;
}
```

### HTTP Status Codes
- **200**: OK
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict
- **422**: Unprocessable Entity
- **500**: Server Error

## 🛠️ Development Tools & Hooks

### Code Quality
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit validation
- **Lint-staged**: Staged file linting

### Testing
- **Jest**: Unit and integration testing
- **Test Coverage**: Coverage reporting enabled
- **E2E Testing**: End-to-end test configuration

### Database Tools
- **TypeORM UML**: Database schema visualization
- **Seeders**: Database seeding scripts
- **Migrations**: Database version control

## 🐳 Deployment & Infrastructure

### Docker Configuration
```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      - DB_HOST=db
      - DB_PORT=5432
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: we_oversee
```

### PM2 Process Management
- **Cluster Mode**: Single instance with auto-restart
- **Memory Limit**: 2GB restart threshold
- **Logging**: Structured logging with rotation

### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=we_oversee

# JWT
JWT_SECRET_KEY=your_secret_key

# Pagination
PAGE_LIMIT=10

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

## 📦 Installation & Setup

### Prerequisites
- Node.js 21.1.0+
- PostgreSQL 15+
- Yarn package manager

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd we-oversee-backend
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Configure your environment variables
   ```

4. **Database setup**
   ```bash
   # Start PostgreSQL
   # Create database: we_oversee
   # Update .env with database credentials
   ```

5. **Run the application**
   ```bash
   # Development mode
   yarn start:dev
   
   # Production build
   yarn build
   yarn start:prod
   ```

### Docker Setup

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   - API: http://localhost:3000/api
   - Documentation: http://localhost:3000/api-docs

## 🔧 Available Scripts

```json
{
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main",
  "build": "nest build",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:e2e": "jest --config ./test/jest-e2e.json",
  "seed": "ts-node src/app/seeders/seed-run.ts",
  "lint": "eslint \"{src,apps,libs}/**/*.ts\" --fix",
  "format": "prettier --write \"src/**/*.ts\"",
  "typecheck": "tsc --noEmit",
  "db:diagram": "typeorm-uml ormconfig.json"
}
```

## 🏗️ Project Structure

```
src/
├── app/
│   ├── commons/           # Shared utilities and base classes
│   │   ├── base.controller.ts
│   │   ├── base.request.ts
│   │   ├── jwt.config.ts
│   │   ├── jwt.strategy.ts
│   │   ├── logger.service.ts
│   │   └── pinoLogger.config.ts
│   ├── config/            # Configuration files
│   │   └── typeorm.config.ts
│   ├── contracts/         # Interfaces, types, and enums
│   │   ├── enums/         # Business logic enums
│   │   ├── interfaces/    # Data contracts
│   │   └── types/         # Type definitions
│   ├── decorators/        # Custom decorators
│   ├── dto/               # Data Transfer Objects
│   ├── filters/           # Exception filters
│   ├── guards/            # Authentication guards
│   ├── models/            # Database entities
│   ├── pipes/             # Validation pipes
│   ├── repositories/      # Data access layer
│   ├── response/          # Response models
│   ├── seeders/           # Database seeders
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
├── properties/            # Property module
├── users/                 # User module
└── main.ts               # Application entry point
```

## 🔍 Key Features

- **Multi-tenant Architecture**: Support for different user types and roles
- **Property Management**: Comprehensive property tracking and management
- **Service Request System**: End-to-end service request lifecycle
- **Estimate & Billing**: Integrated estimation and invoicing system
- **Guest Management**: Guest access and communication tracking
- **Payment Integration**: Flexible payment method support
- **Notification System**: Multi-channel notification delivery
- **Document Management**: File upload and management capabilities

## 🤝 Contributing

1. Follow the established code structure and patterns
2. Ensure all tests pass before submitting
3. Use conventional commit messages
4. Update documentation for new features
5. Follow the established coding standards

## 📄 License

This project is proprietary and confidential.

---

**Built with ❤️ using NestJS, TypeORM, and PostgreSQL**

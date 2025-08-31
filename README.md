# MP3 File Analysis App

A NestJS-based REST API application that analyzes MP3 files and counts the number of MP3 frames. Built with TypeScript and custom MP3 parsing algorithms.

## 🎯 Features

- **MP3 File Upload**: Accepts MP3 files via HTTP POST requests
- **Custom Frame Parser**: Built-in MP3 frame counting without external NPM packages
- **MPEG Version 1 Audio Layer 3 Support**: Specifically designed for MP3 format
- **File Validation**: Ensures only MP3 files are processed
- **Swagger Documentation**: Interactive API documentation
- **Error Handling**: Comprehensive error handling and validation

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd assessment
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run start:dev
   # or
   yarn start:dev
   ```

4. **Access the application**
   - **API Base URL**: `http://localhost:3002/api`
   - **Swagger Documentation**: `http://localhost:3002/api-docs`
   - **Health Check**: `http://localhost:3002/api/ping`

## 📁 Project Structure

```
src/
├── app/
│   ├── commons/           # Common services and utilities
│   ├── constants/         # API documentation constants
│   ├── dto/              # Data Transfer Objects
│   ├── pipes/            # Custom validation pipes
│   └── mp3-analysis.service.ts  # MP3 parsing logic
├── app.controller.ts      # Main API controller
├── app.module.ts          # Application module
├── app.service.ts         # Basic app service
└── main.ts               # Application entry point
```

## 🔌 API Endpoints

### 1. Health Check
- **GET** `/api/ping`
- **Description**: Basic health check endpoint
- **Response**: `{ "success": true }`

### 2. MP3 File Analysis
- **POST** `/api/file-upload`
- **Description**: Upload and analyze MP3 file to count frames
- **Content-Type**: `multipart/form-data`
- **Request Body**: 
  ```
  file: [MP3 file]
  ```
- **Response**: 
  ```json
  {
    "frameCount": 1500
  }
  ```

## 🎵 MP3 Frame Counting Algorithm

The application implements a custom MP3 frame parser that:

1. **Skips ID3v2 Tags**: Identifies and skips metadata tags
2. **Finds MPEG Sync Words**: Locates frame boundaries using 11-bit sync patterns
3. **Validates Frame Headers**: Ensures MPEG Version 1, Layer 3 compliance
4. **Calculates Frame Sizes**: Uses bitrate and sample rate information
5. **Counts Valid Frames**: Iterates through the file counting valid MP3 frames

### Technical Details

- **MPEG Version**: 1 (MPEG-1)
- **Layer**: 3 (MP3)
- **Supported Bitrates**: 32-320 kbps
- **Sample Rates**: 32kHz, 44.1kHz, 48kHz
- **Frame Size Calculation**: `(144 * bitrate * 1000) / sampleRate + padding`

## 🧪 Testing

### Manual Testing

1. **Using Swagger UI**
   - Navigate to `http://localhost:3002/api-docs`
   - Find the `/file-upload` endpoint
   - Click "Try it out"
   - Upload an MP3 file
   - Execute the request

2. **Using cURL**
   ```bash
   curl -X POST http://localhost:3002/api/file-upload \
     -F "file=@path/to/your/file.mp3" \
     -H "Accept: application/json"
   ```

3. **Using Postman**
   - Set method to `POST`
   - URL: `http://localhost:3002/api/file-upload`
   - Body: `form-data`
   - Key: `file` (Type: File)
   - Value: Select your MP3 file

### Validation

To verify the frame count accuracy, use the `mediainfo` tool:
```bash
mediainfo your-file.mp3
```

## 🛠️ Development

### Available Scripts

- **`npm run build`**: Build the application
- **`npm run start:dev`**: Start development server with hot reload
- **`npm run start:debug`**: Start with debug mode
- **`npm run start:prod`**: Start production server
- **`npm run lint`**: Run ESLint
- **`npm run test`**: Run unit tests

### Adding New Features

1. **Create DTOs** in `src/app/dto/`
2. **Add Services** in `src/app/` or create new modules
3. **Update Controller** in `src/app.controller.ts`
4. **Add Validation** using pipes in `src/app/pipes/`
5. **Document API** using Swagger decorators

## 🔒 Security & Validation

- **File Type Validation**: Only MP3 files accepted
- **File Size Limit**: 50MB maximum file size
- **Input Sanitization**: Proper error handling and validation
- **CORS Enabled**: Configured for development and production

## 📚 Dependencies

### Core Dependencies
- `@nestjs/common`: NestJS core framework
- `@nestjs/platform-express`: Express platform integration
- `@nestjs/swagger`: API documentation
- `@nestjs/config`: Configuration management
- `multer`: File upload handling

### Development Dependencies
- `@nestjs/cli`: NestJS command line tools
- `typescript`: TypeScript compiler
- `eslint`: Code linting
- `prettier`: Code formatting

## 🚨 Error Handling

The application handles various error scenarios:

- **No File Uploaded**: Returns 400 with "No file uploaded" message
- **Invalid File Type**: Returns 400 with "Only MP3 files are allowed" message
- **File Too Large**: Returns 400 with size limit exceeded message
- **MP3 Parsing Errors**: Returns 400 with parsing failure details
- **Server Errors**: Returns 500 with appropriate error messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is part of a technical assessment and is not licensed for commercial use.

## 🆘 Support

For technical issues or questions:
1. Check the Swagger documentation at `/api-docs`
2. Review the error logs in the console
3. Verify file format and size requirements
4. Ensure the server is running on the correct port

---

**Built with ❤️ using NestJS and TypeScript**

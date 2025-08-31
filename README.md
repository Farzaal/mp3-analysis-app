# MP3 File Analysis App

A high-performance NestJS application that analyzes MP3 files and counts MPEG frames using streaming technology for memory-efficient processing of large files.

## 🚀 Getting Started

### Quick Run (5 steps)

```bash
# 1. Clone the repository
git clone <repository-url>
cd assessment

# 2. Install dependencies
npm install

# 3. Set up environment
cp env.example .env
# Edit .env with your configuration (see Environment Variables below)

# 4. Start the application
npm run start:dev

# 5. Open in browser
# Swagger UI: http://localhost:3000/api-docs
# Health Check: http://localhost:3000/ping
```

### Environment Setup

```bash
# Copy environment template
cp env.example .env

# Edit .env file with your settings
# Key variables to configure:
# - MAX_FILE_SIZE: Maximum file upload size (default: 5GB)
# - PORT: Application port (default: 3000)
# - NODE_ENV: Environment (development/production)
```

### Environment Variables

```bash
# Application Configuration
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

```

### Test the API

1. **Upload an MP3 file** using the `/file-upload` endpoint
2. **Get frame count** in the response
3. **Compare results** with `mediainfo` tool for validation

---

## 🚀 Features

- **Streaming MP3 Analysis**: O(1) memory usage for files of any size
- **Accurate Frame Counting**: Custom MP3 parser with two-header confirmation
- **Large File Support**: Handles multi-GB MP3 files efficiently
- **Real-time Processing**: Analyzes files as they stream in
- **Comprehensive Validation**: File type, size, and content validation
- **Swagger Documentation**: Interactive API documentation
- **Structured Logging**: Bunyan-based logging with detailed MP3 processing insights

## 🏗️ Architecture

### Core Components

- **`Mp3AnalysisService`**: Streaming MP3 frame counter with sliding buffer
- **`FileValidationPipe`**: Comprehensive file validation (type, size, content)
- **`AppController`**: REST API endpoint for file uploads
- **`BunyanLogger`**: Structured logging service

### MP3 Parsing Algorithm

- **Sliding Buffer**: 4KB rolling buffer for cross-chunk frame detection
- **Two-Header Confirmation**: Validates frames by checking subsequent headers
- **ID3v2 Support**: Handles ID3v2 tags with footer support
- **MPEG-1 Layer III**: Supports standard MP3 format
- **Duplicate Prevention**: Global position tracking prevents double-counting

## 📡 API Endpoints

### POST /file-upload

Upload and analyze an MP3 file to count frames.

**Request:**
- **Content-Type**: `multipart/form-data`
- **Body**: `file` (MP3 file)

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "frameCount": 1500
  },
  "code": 200
}
```

**Error Responses:**
- `400`: No file uploaded, invalid file type, or file too large
- `413`: File size exceeds limit
- `500`: Internal server error during processing

## 🔍 MP3 Frame Counting Algorithm

### Streaming Approach

1. **Chunk Processing**: Files are processed in chunks as they stream in
2. **Sliding Buffer**: Maintains 4KB buffer for cross-chunk boundary detection
3. **Frame Detection**: Scans for MPEG sync words (0xFF + 0xE0 pattern)
4. **Header Validation**: Parses MPEG version, layer, bitrate, and sample rate
5. **Two-Header Confirmation**: Validates current frame by checking next frame
6. **Duplicate Prevention**: Global position tracking ensures accurate counting

### Frame Header Structure

```
Byte 1: 11111111 (0xFF - Sync word)
Byte 2: 111xxxxx (0xE0 + version + layer + protection)
Byte 3: xxxx xxxx (bitrate + sample rate + padding + protection)
```

### Supported Formats

- **MPEG Version**: MPEG-1 only
- **Layer**: Layer III only
- **Bitrates**: 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 288, 320 kbps
- **Sample Rates**: 44.1kHz, 48kHz, 32kHz

### Manual Testing

1. **Start the application**: `npm run start:dev`
2. **Open Swagger UI**: `http://localhost:3000/api-docs`
3. **Upload MP3 file**: Use the `/file-upload` endpoint
4. **Verify frame count**: Compare with `mediainfo` tool

## 📊 Performance Characteristics

### Memory Usage
- **Constant Memory**: O(1) - 4KB sliding buffer regardless of file size
- **Scalability**: Handles files of arbitrary size
- **Efficiency**: No file buffering in memory

### Processing Speed
- **Real-time**: Processes data as it arrives
- **Optimized**: Minimal CPU overhead for frame detection
- **Streaming**: Limited only by stream read rate

### File Size Limits
- **Default**: 5GB (configurable)
- **Validation**: Both Multer and custom pipe validation

## 🔧 Configuration

### File Validation Settings

```typescript
// In FileValidationPipe
const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
const FRAME_SIZE_MIN = 20;               // Minimum frame size
const FRAME_SIZE_MAX = 10000;            // Maximum frame size
```

### Streaming Configuration

```typescript
// In Mp3AnalysisService
const SLIDING_BUFFER_SIZE = 4 * 1024;   // 4KB sliding buffer
const STREAM_CHUNK_SIZE = 8192;         // 8KB chunk processing
```

## 🐛 Troubleshooting

### Common Issues

1. **"No file uploaded" Error**
   - Ensure file field name is `file`
   - Check file size doesn't exceed limit

2. **"Only MP3 files are allowed" Error**
   - Verify file is valid MP3 format
   - Check file has proper MPEG headers

3. **Memory Issues with Large Files**
   - Ensure streaming mode is enabled
   - Check sliding buffer size configuration

4. **Incorrect Frame Counts**
   - Verify MP3 format compatibility
   - Check for corrupted file headers

### Debug Logging

Enable debug logging to see detailed processing information:

```bash
LOG_LEVEL=debug npm run start:dev
```

## 🔮 Future Enhancements

- **Parallel Processing**: Worker threads for faster analysis
- **Advanced Validation**: CRC checking and frame integrity verification
- **Metadata Extraction**: ID3 tag parsing and audio quality metrics
- **Batch Processing**: Multiple file upload and analysis
- **Performance Metrics**: Processing time and throughput monitoring

## 📚 Technical Details

### Dependencies

- **NestJS**: Framework for building scalable server-side applications
- **Multer**: Middleware for handling multipart/form-data
- **Bunyan**: Structured logging library
- **Swagger**: API documentation and testing

### File Processing Flow

```
File Upload → Multer → FileValidationPipe → Stream Creation → MP3 Analysis → Frame Count
     ↓              ↓           ↓              ↓              ↓           ↓
  Raw File    File Buffer   Validated    Readable Stream   Sliding     Response
                                    File              Buffer
```

### Error Handling

- **Validation Errors**: Caught by validation pipe
- **Processing Errors**: Caught by stream error handlers
- **System Errors**: Caught by global exception filters
- **User Feedback**: Clear error messages with HTTP status codes
# AWS IP Middleware Proxy

A secure middleware proxy service that routes API requests through whitelisted AWS IP addresses to access external APIs that require IP whitelisting.

## Overview

The AWS IP Middleware Proxy acts as an intermediary between your betting platform and external API providers. It leverages your whitelisted AWS IP addresses to make requests to external APIs while providing authentication, caching, rate limiting, and comprehensive logging.

## Features

- ✅ **IP Whitelisting**: Routes requests through AWS IP addresses
- ✅ **Multi-Provider Support**: Configure multiple external API providers
- ✅ **Authentication**: JWT and API key authentication
- ✅ **Caching**: Redis-based response caching with configurable TTL
- ✅ **Rate Limiting**: Per-user and per-provider rate limiting
- ✅ **Retry Logic**: Exponential backoff with circuit breaker
- ✅ **Comprehensive Logging**: Structured logging with correlation IDs
- ✅ **Health Monitoring**: Health checks and metrics collection
- ✅ **Hot Configuration**: Runtime configuration reloading

## Architecture

```
[Client] → [AWS IP Proxy] → [External API Provider]
              ↓
         [Redis Cache]
              ↓
         [Winston Logger]
```

## Installation

The proxy is integrated into the existing external API server. No additional installation required.

## Configuration

### Provider Configuration

Edit `backend/proxy-config.json` to configure external API providers:

```json
{
  "providers": {
    "cricket-api": {
      "name": "Cricket API Provider",
      "baseUrl": "https://marketsarket.qnsports.live",
      "timeout": 10000,
      "retries": 3,
      "cacheTtl": 300,
      "rateLimit": {
        "windowMs": 60000,
        "max": 100
      },
      "headers": {
        "User-Agent": "AWS-IP-Proxy/1.0",
        "Accept": "application/json"
      },
      "endpoints": {
        "cricketmatches": "/cricketmatches",
        "odds": "/odds"
      }
    }
  },
  "global": {
    "maxCacheSize": 1000,
    "defaultTimeout": 10000,
    "defaultRetries": 3,
    "logLevel": "info"
  }
}
```

### Environment Variables

```bash
# Authentication
JWT_SECRET=your-jwt-secret-key
VALID_API_KEYS=key1,key2,key3

# Redis (for caching)
REDIS_URL=redis://localhost:6380

# Logging
LOG_LEVEL=info

# Rate Limiting
GLOBAL_RATE_LIMIT_MAX=200
GLOBAL_RATE_LIMIT_WINDOW=60000
```

## API Endpoints

### Main Proxy Endpoint

**POST** `/proxy/api/{provider}`

Routes requests through the specified provider.

**Headers:**
- `Authorization: Bearer <jwt-token>` OR
- `X-API-Key: <api-key>`

**Request Body:**
```json
{
  "endpoint": "cricketmatches",
  "method": "GET",
  "headers": {
    "Custom-Header": "value"
  },
  "queryParams": {
    "param1": "value1"
  },
  "body": {
    "data": "for POST requests"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "// API response data"
  },
  "meta": {
    "requestId": "uuid",
    "provider": "cricket-api",
    "endpoint": "cricketmatches",
    "method": "GET",
    "cached": false,
    "responseTime": 1234,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Health Check

**GET** `/proxy/health`

Returns proxy service health status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "aws-ip-proxy",
  "version": "1.0.0",
  "providers": {
    "cricket-api": {
      "name": "Cricket API Provider",
      "status": "configured",
      "baseUrl": "https://marketsarket.qnsports.live"
    }
  },
  "cache": {
    "status": "healthy",
    "connection": true,
    "stats": {
      "hits": 150,
      "misses": 50,
      "hitRate": "75.00%"
    }
  }
}
```

### Configuration Management

**GET** `/proxy/config` (Requires Authentication)

Returns current configuration status.

**POST** `/proxy/config/reload` (Requires Admin Role)

Reloads configuration from file.

### Cache Management

**GET** `/proxy/cache/stats` (Requires Authentication)

Returns cache statistics.

**DELETE** `/proxy/cache/{provider?}` (Requires Authentication)

Clears cache for specific provider or all cache.

## Usage Examples

### Basic Cricket API Request

```bash
curl -X POST http://localhost:4001/proxy/api/cricket-api \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "cricketmatches",
    "method": "GET"
  }'
```

### Request with Query Parameters

```bash
curl -X POST http://localhost:4001/proxy/api/cricket-api \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "odds",
    "method": "GET",
    "queryParams": {
      "eventId": "123456"
    }
  }'
```

### POST Request with Body

```bash
curl -X POST http://localhost:4001/proxy/api/custom-api \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "data",
    "method": "POST",
    "body": {
      "key": "value",
      "data": "payload"
    }
  }'
```

## Authentication

### JWT Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API Key Authentication

Include API key in header or query parameter:
```
X-API-Key: your-32-character-api-key
```

## Rate Limiting

- **Global Rate Limit**: 200 requests per minute per user/IP
- **Provider-Specific**: Configurable per provider
- **Admin Bypass**: Admin users bypass rate limits
- **Headers**: Rate limit info in response headers

## Caching

- **Redis-Based**: Uses existing Redis instance
- **Configurable TTL**: Per-provider cache duration
- **GET Requests Only**: Only GET requests are cached
- **Fallback Cache**: Emergency fallback for failed requests
- **Cache Keys**: Generated from provider + endpoint + parameters

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "requestId": "correlation-id",
    "provider": "provider-id",
    "endpoint": "endpoint-name",
    "responseTime": 1234,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Common Error Codes

- `MISSING_AUTH_HEADER`: No authorization provided
- `INVALID_TOKEN`: JWT token invalid or expired
- `PROVIDER_NOT_FOUND`: Specified provider not configured
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `PROXY_ERROR`: General proxy error
- `PROXY_HTTP_ERROR`: HTTP error from external API
- `PROXY_NETWORK_ERROR`: Network connectivity error

## Monitoring

### Logs

Structured JSON logs with correlation IDs:

```json
{
  "level": "info",
  "message": "Proxy request completed",
  "requestId": "uuid",
  "provider": "cricket-api",
  "endpoint": "cricketmatches",
  "status": 200,
  "cached": false,
  "responseTime": 1234,
  "userId": "user123",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Metrics

Available metrics:
- Request count by provider
- Response times
- Cache hit/miss ratios
- Error rates
- Active connections

## Security

### Best Practices

1. **Use HTTPS**: Always use HTTPS in production
2. **Rotate API Keys**: Regularly rotate API keys
3. **Monitor Logs**: Watch for suspicious activity
4. **Rate Limiting**: Configure appropriate rate limits
5. **Input Validation**: All inputs are validated and sanitized

### Security Headers

- `helmet` middleware for security headers
- CORS configuration for allowed origins
- Request size limits
- Input sanitization

## Deployment

### AWS Infrastructure

1. **EC2 Instances**: Deploy on EC2 with static IP addresses
2. **Load Balancer**: Use ALB for high availability
3. **Auto Scaling**: Configure auto scaling groups
4. **Security Groups**: Restrict access to necessary ports

### Environment Setup

```bash
# Install dependencies
npm install

# Set environment variables
export JWT_SECRET="your-secret-key"
export REDIS_URL="redis://your-redis-host:6380"
export VALID_API_KEYS="key1,key2,key3"

# Start the server
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4001
CMD ["node", "externalapi/index.js"]
```

## Troubleshooting

### Common Issues

1. **Configuration Not Loading**
   - Check file permissions on `proxy-config.json`
   - Verify JSON syntax
   - Check logs for configuration errors

2. **Authentication Failures**
   - Verify JWT_SECRET environment variable
   - Check token expiration
   - Validate API key format

3. **Cache Issues**
   - Verify Redis connection
   - Check Redis memory usage
   - Review cache TTL settings

4. **Rate Limiting**
   - Check rate limit configuration
   - Monitor user request patterns
   - Adjust limits as needed

### Debug Mode

Enable debug logging:
```bash
export LOG_LEVEL=debug
```

### Health Checks

Monitor these endpoints:
- `/proxy/health` - Service health
- `/proxy/cache/stats` - Cache performance
- `/proxy/config` - Configuration status

## Support

For issues and questions:
1. Check logs for error details
2. Verify configuration syntax
3. Test with health check endpoints
4. Review rate limiting settings

## Version History

- **v1.0.0**: Initial release with core proxy functionality
  - Multi-provider support
  - JWT and API key authentication
  - Redis caching
  - Rate limiting
  - Comprehensive logging
  - Health monitoring
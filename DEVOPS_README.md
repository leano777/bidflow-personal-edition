# BidFlow DevOps Infrastructure

This document outlines the complete DevOps, deployment, and monitoring infrastructure for the BidFlow construction estimating system.

## 🏗️ Architecture Overview

### Services
- **Frontend**: Next.js 14 application with TypeScript
- **NLP Engine**: Python FastAPI service with construction-specific NLP processing
- **Neo4j**: Graph database for construction ontology storage
- **Redis**: Caching layer for improved performance

### Infrastructure Components
- **Docker**: Containerization of all services
- **Kubernetes**: Container orchestration and deployment
- **GitHub Actions**: CI/CD pipeline with automated testing and deployment
- **Prometheus**: Metrics collection and monitoring
- **Grafana**: Visualization and dashboards
- **Jaeger**: Distributed tracing
- **OpenTelemetry**: Observability instrumentation

## 🚀 Quick Start

### Development Environment

1. **Start the development stack:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh dev
   ```

2. **Access the services:**
   - Frontend: http://localhost:3000
   - NLP Engine API: http://localhost:8000
   - Grafana Dashboard: http://localhost:3001 (admin/bidflow2024)
   - Prometheus: http://localhost:9090
   - Jaeger Traces: http://localhost:16686
   - Neo4j Browser: http://localhost:7474

### Production Deployment

1. **Configure Kubernetes access:**
   ```bash
   # Set up your kubeconfig file
   export KUBECONFIG=path/to/your/kubeconfig
   ```

2. **Deploy to Kubernetes:**
   ```bash
   ./deploy.sh k8s production
   ```

## 📊 Monitoring & Observability

### Key Metrics Tracked

1. **NLP Parsing Latency SLA**: < 2 seconds (95th percentile)
2. **Cost Engine Error Rate SLA**: < 5% error rate
3. **System Availability**: > 99.9% uptime
4. **Resource Utilization**: CPU, Memory, Disk usage

### SLA Alerts

The system automatically monitors and alerts on:

- **Parsing Latency High**: When 95th percentile > 2s for 2 minutes
- **Parsing Latency Critical**: When 95th percentile > 5s for 1 minute  
- **Cost Engine Error Rate High**: When error rate > 5% for 2 minutes
- **Cost Engine Error Rate Critical**: When error rate > 10% for 1 minute
- **Service Down**: When any service is unavailable for 30 seconds
- **High Memory Usage**: When memory usage > 90% for 2 minutes

### Dashboards

**BidFlow System Dashboard** includes:
- System Overview (service status)
- NLP Parsing Latency trends
- Request rate and error rate metrics  
- Ontology query performance
- Resource utilization (CPU/Memory)
- Database connection status
- Active alerts

## 🔄 CI/CD Pipeline

### Workflow Triggers
- **Push to main**: Full deployment to production
- **Push to develop**: Deployment to development environment
- **Pull requests**: Run tests and security scans
- **Git tags**: Versioned releases with automated deployment

### Pipeline Stages

1. **Testing**
   - Frontend: TypeScript checking, linting, unit tests
   - NLP Engine: Python tests with Neo4j and Redis
   - Security scanning with Trivy

2. **Model Versioning**
   - Automated model training and versioning with MLflow
   - Model artifact storage in S3
   - Model performance tracking

3. **Build & Push**
   - Multi-stage Docker builds
   - Container image scanning
   - Push to GitHub Container Registry

4. **Deployment**
   - Environment-specific deployments
   - Rolling updates with health checks
   - Automated rollback on failure

5. **Testing**
   - Smoke tests after deployment
   - Load testing with k6
   - Performance validation

## 🐳 Docker Architecture

### Frontend Container (`Dockerfile.frontend`)
- Multi-stage build with Node.js 18
- OpenTelemetry instrumentation
- Health checks and metrics endpoints
- Optimized for production with output tracing

### NLP Engine Container (`Dockerfile.nlp`)  
- Python 3.11 slim base image
- Complete ML stack (spaCy, transformers, torch)
- FastAPI with Prometheus metrics
- OpenTelemetry tracing integration
- Non-root user for security

## ☸️ Kubernetes Deployment

### Namespace: `bidflow`
All services are deployed in the dedicated `bidflow` namespace.

### High Availability Setup
- **Frontend**: 2 replicas with rolling updates
- **NLP Engine**: 3 replicas with resource limits  
- **Monitoring**: Single replicas with persistent storage

### Resource Allocation
```yaml
# NLP Engine
requests: 512Mi memory, 250m CPU
limits: 1Gi memory, 500m CPU

# Frontend  
requests: 256Mi memory, 100m CPU
limits: 512Mi memory, 200m CPU
```

### Storage
- **Prometheus**: 20Gi fast SSD for metrics data
- **Grafana**: 5Gi fast SSD for dashboards
- **NLP Models**: 5Gi shared storage for model artifacts

## 🔐 Security

### Container Security
- Non-root users in all containers
- Minimal base images (slim/alpine)
- Vulnerability scanning with Trivy
- Secret management with Kubernetes secrets

### Network Security
- Service-to-service communication within cluster
- TLS termination at ingress
- Network policies for traffic control

## 📈 Performance & Scalability

### Auto-scaling
- Horizontal Pod Autoscaling based on CPU/memory
- Vertical Pod Autoscaling for optimal resource allocation

### Performance Testing
- Automated load testing with k6
- SLA validation: 95% of requests < 2s, error rate < 5%
- Continuous performance monitoring

## 🛠️ Operations

### Health Checks
All services expose `/health` endpoints for:
- Kubernetes liveness/readiness probes
- Load balancer health checks  
- Monitoring system validation

### Logging
- Structured JSON logging
- Centralized log aggregation
- Log retention policies

### Backup & Recovery
- Database backups with point-in-time recovery
- Model artifact versioning and storage
- Configuration as code for infrastructure recovery

## 🔧 Development Workflow

1. **Local Development:**
   ```bash
   # Start development environment
   ./deploy.sh dev
   
   # Run tests
   ./deploy.sh test
   
   # Load testing
   ./deploy.sh load-test
   ```

2. **Feature Development:**
   - Create feature branch
   - Develop with hot reload using Docker volumes
   - Commit triggers CI pipeline
   - PR creates preview environment

3. **Deployment:**
   - Merge to develop → auto-deploy to development
   - Tag release → auto-deploy to production
   - Monitor dashboards for health

## 📞 Troubleshooting

### Common Issues

1. **Service startup failures:**
   ```bash
   # Check pod status
   kubectl get pods -n bidflow
   kubectl describe pod <pod-name> -n bidflow
   kubectl logs <pod-name> -n bidflow
   ```

2. **Performance issues:**
   - Check Grafana dashboards for bottlenecks
   - Review Jaeger traces for slow operations
   - Examine resource utilization metrics

3. **Database connection issues:**
   - Verify Neo4j and Redis connectivity
   - Check secret configurations
   - Review network policies

### Monitoring Endpoints

- **Health Check**: `GET /health` (returns service status)
- **Metrics**: `GET /metrics` (Prometheus format)
- **Traces**: Automatically sent to Jaeger collector

## 📋 Maintenance

### Regular Tasks
- Monitor SLA compliance via Grafana alerts
- Review security scan results in GitHub Security tab
- Update dependencies and container images
- Validate backup and recovery procedures

### Capacity Planning
- Monitor resource utilization trends
- Scale services based on load patterns
- Review and adjust resource requests/limits
- Plan for seasonal usage variations

## 🎯 SLA Summary

| Metric | SLA Target | Alert Threshold |
|--------|------------|-----------------|
| NLP Parsing Latency (95th percentile) | < 2 seconds | 2 seconds |
| Cost Engine Error Rate | < 5% | 5% |
| System Availability | > 99.9% | 30 seconds downtime |
| Response Time | < 3 seconds | 3 seconds |

This infrastructure provides a robust, scalable, and observable platform for the BidFlow construction estimating system with comprehensive monitoring, automated deployments, and adherence to strict SLAs.

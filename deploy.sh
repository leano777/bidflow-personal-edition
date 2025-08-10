#!/bin/bash

# BidFlow DevOps Deployment Script
# This script sets up the complete DevOps infrastructure

set -e

echo "🚀 BidFlow DevOps Deployment Script"
echo "=================================="

# Check if required tools are installed
check_dependencies() {
    local dependencies=("docker" "docker-compose" "kubectl" "helm")
    
    echo "📋 Checking dependencies..."
    for dep in "${dependencies[@]}"; do
        if ! command -v $dep &> /dev/null; then
            echo "❌ $dep is not installed. Please install it and try again."
            exit 1
        else
            echo "✅ $dep is available"
        fi
    done
}

# Setup development environment
setup_development() {
    echo "🛠️  Setting up development environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        echo "📝 Creating .env file..."
        cat > .env << 'EOF'
# Database Configuration
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=bidflow2024
REDIS_URL=redis://redis:6379

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:8000

# Monitoring Configuration
GRAFANA_ADMIN_PASSWORD=bidflow2024
PROMETHEUS_RETENTION=200h

# OpenTelemetry Configuration
OTEL_EXPORTER_JAEGER_ENDPOINT=http://jaeger:14268/api/traces
OTEL_SERVICE_NAME=bidflow-system
EOF
    fi
    
    # Start development services
    echo "🐳 Starting Docker Compose services..."
    docker-compose up -d
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    echo "🏥 Checking service health..."
    check_service_health "http://localhost:3000/api/health" "Frontend"
    check_service_health "http://localhost:8000/health" "NLP Engine"
    check_service_health "http://localhost:9090/-/healthy" "Prometheus"
    check_service_health "http://localhost:3001/api/health" "Grafana"
    
    echo "✅ Development environment is ready!"
    echo "🌐 Access points:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - NLP Engine: http://localhost:8000"
    echo "   - Grafana: http://localhost:3001 (admin/bidflow2024)"
    echo "   - Prometheus: http://localhost:9090"
    echo "   - Jaeger: http://localhost:16686"
    echo "   - Neo4j Browser: http://localhost:7474"
}

# Check service health
check_service_health() {
    local url=$1
    local name=$2
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s $url > /dev/null 2>&1; then
            echo "✅ $name is healthy"
            return 0
        fi
        
        echo "⏳ Waiting for $name to be ready (attempt $attempt/$max_attempts)..."
        sleep 10
        ((attempt++))
    done
    
    echo "❌ $name failed to become healthy"
    return 1
}

# Deploy to Kubernetes
deploy_kubernetes() {
    local environment=${1:-development}
    
    echo "☸️  Deploying to Kubernetes ($environment)..."
    
    # Create namespace
    kubectl apply -f k8s/namespace.yaml
    
    # Create secrets
    create_kubernetes_secrets
    
    # Apply configurations
    kubectl create configmap prometheus-config --from-file=monitoring/prometheus.yml -n bidflow --dry-run=client -o yaml | kubectl apply -f -
    kubectl create configmap grafana-provisioning --from-file=monitoring/grafana/provisioning/ -n bidflow --dry-run=client -o yaml | kubectl apply -f -
    kubectl create configmap grafana-dashboards --from-file=monitoring/grafana/dashboards/ -n bidflow --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy applications
    kubectl apply -f k8s/ -n bidflow
    
    # Wait for deployments
    echo "⏳ Waiting for deployments to be ready..."
    kubectl rollout status deployment/frontend -n bidflow --timeout=300s
    kubectl rollout status deployment/nlp-engine -n bidflow --timeout=300s
    kubectl rollout status deployment/prometheus -n bidflow --timeout=300s
    kubectl rollout status deployment/grafana -n bidflow --timeout=300s
    
    echo "✅ Kubernetes deployment completed!"
}

# Create Kubernetes secrets
create_kubernetes_secrets() {
    echo "🔐 Creating Kubernetes secrets..."
    
    # Neo4j secret
    kubectl create secret generic neo4j-secret \
        --from-literal=password=bidflow2024 \
        -n bidflow --dry-run=client -o yaml | kubectl apply -f -
    
    # Grafana secret  
    kubectl create secret generic grafana-secret \
        --from-literal=password=bidflow2024 \
        -n bidflow --dry-run=client -o yaml | kubectl apply -f -
}

# Build Docker images
build_images() {
    echo "🐳 Building Docker images..."
    
    # Build frontend image
    echo "📦 Building frontend image..."
    docker build -f docker/Dockerfile.frontend -t bidflow/frontend:latest .
    
    # Build NLP engine image
    echo "📦 Building NLP engine image..."
    docker build -f docker/Dockerfile.nlp -t bidflow/nlp-engine:latest .
    
    echo "✅ Docker images built successfully!"
}

# Run tests
run_tests() {
    echo "🧪 Running tests..."
    
    # Frontend tests
    echo "🧪 Running frontend tests..."
    npm test
    
    # NLP engine tests
    echo "🧪 Running NLP engine tests..."
    python -m pytest test_construction_nlp.py -v
    
    echo "✅ All tests passed!"
}

# Load test
load_test() {
    echo "🔥 Running load tests..."
    
    # Check if k6 is installed
    if ! command -v k6 &> /dev/null; then
        echo "📦 Installing k6..."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
            echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
            sudo apt-get update
            sudo apt-get install k6
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install k6
        fi
    fi
    
    # Create load test script
    cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 10 }, // Ramp up
    { duration: '3m', target: 10 }, // Stay at 10 users
    { duration: '1m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
  },
};

export default function () {
  // Test NLP parsing endpoint
  let response = http.post('http://localhost:8000/parse', JSON.stringify({
    text: 'Install 100 LF of 6 inch concrete sidewalk with reinforcement'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
    'has entities': (r) => JSON.parse(r.body).entities.length > 0,
  });
  
  sleep(1);
}
EOF
    
    # Run load test
    k6 run load-test.js
    rm -f load-test.js
    
    echo "✅ Load test completed!"
}

# Show usage
usage() {
    cat << EOF
Usage: $0 [COMMAND]

Commands:
    dev         Setup development environment with Docker Compose
    build       Build Docker images
    test        Run all tests
    k8s         Deploy to Kubernetes (requires kubectl access)
    load-test   Run performance/load tests
    clean       Clean up development environment
    help        Show this help message

Examples:
    $0 dev              # Start development environment
    $0 build            # Build all Docker images
    $0 k8s development  # Deploy to Kubernetes development environment
    $0 load-test        # Run load tests against local environment
    $0 clean            # Stop and remove all containers
EOF
}

# Clean up
clean() {
    echo "🧹 Cleaning up..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    echo "✅ Cleanup completed!"
}

# Main script logic
main() {
    case "${1:-help}" in
        "dev"|"development")
            check_dependencies
            setup_development
            ;;
        "build")
            check_dependencies
            build_images
            ;;
        "test")
            run_tests
            ;;
        "k8s"|"kubernetes")
            check_dependencies
            deploy_kubernetes "${2:-development}"
            ;;
        "load-test")
            load_test
            ;;
        "clean")
            clean
            ;;
        "help"|*)
            usage
            ;;
    esac
}

# Run main function with all arguments
main "$@"

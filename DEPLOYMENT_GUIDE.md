# Deployment Guide: Docker → ECR → ECS

This guide walks you through deploying your ACFBR application to AWS ECS using Fargate.

## Prerequisites

- AWS CLI installed and configured (`aws configure`)
- Docker installed
- AWS account with appropriate permissions (ECR, ECS, RDS, VPC, Security Groups)

## Part 1: Build and Push Docker Image to ECR

### Step 1: Set Environment Variables

```bash
export AWS_REGION=us-west-2
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPO=acfbr
export IMAGE_TAG=latest
```

### Step 2: Create ECR Repository (if it doesn't exist)

```bash
aws ecr create-repository \
  --repository-name $ECR_REPO \
  --region $AWS_REGION
```

Or create it via AWS Console:
- Go to ECR → Repositories → Create repository
- Name: `acfbr`
- Visibility: Private
- Create

### Step 3: Login Docker to ECR

```bash
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
```

### Step 4: Build and Push Image

**For Mac (Apple Silicon) - Build for linux/amd64:**

```bash
# Create buildx builder if it doesn't exist
docker buildx create --use --name acfbr_builder 2>/dev/null || docker buildx use acfbr_builder

# Build and push
docker buildx build \
  --platform linux/amd64 \
  -t ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG} \
  --push .
```

**For Linux/Windows (x86_64):**

```bash
# Build the image
docker build -t ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG} .

# Tag it
docker tag ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG} \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}

# Push to ECR
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}
```

### Step 5: Verify Image in ECR

```bash
aws ecr describe-images \
  --repository-name $ECR_REPO \
  --region $AWS_REGION
```

Or check in AWS Console: ECR → Repositories → acfbr

---

## Part 2: Create ECS Infrastructure

### Step 6: Create ECS Cluster

**Via AWS Console:**
1. Go to ECS → Clusters
2. Click "Create cluster"
3. Cluster name: `acfbr-cluster`
4. Infrastructure: AWS Fargate (serverless)
5. Click "Create"

**Via AWS CLI:**
```bash
aws ecs create-cluster \
  --cluster-name acfbr-cluster \
  --region $AWS_REGION
```

### Step 7: Create Task Definition

**Via AWS Console:**
1. Go to ECS → Task definitions → Create new task definition
2. Launch type: Fargate
3. Task definition family: `acfbr`
4. Operating system/Architecture: Linux/X86_64
5. Task size:
   - CPU: 0.25 vCPU (256)
   - Memory: 0.5 GB (512)
6. Container details:
   - Container name: `acfbr`
   - Image URI: `${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/acfbr:latest`
   - Port mappings: 3000 (Container port) → 3000 (Host port) → TCP
   - Environment variables (add all of these):

```
DATABASE_URL=postgresql://postgres:Snoqualmie2015%21@tdpllc-1.cqgd5zbaiuii.us-west-2.rds.amazonaws.com:5432/acfbr?sslmode=require
JWT_SECRET=your-secret-key-change-in-production
SPORTSDB_API_KEY=428457
NODE_ENV=production
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=a046c2001@smtp-brevo.com
SMTP_PASSWORD=Etc4dfDOsMUyvISA
SMTP_FROM=americas.cfb.rankings@gmail.com
APP_URL=https://your-domain.com
```

7. Logging:
   - Log driver: awslogs
   - Log group: `/ecs/acfbr` (create if it doesn't exist)
   - Stream prefix: `ecs`
   - Region: `us-west-2`

8. Click "Create"

**Create CloudWatch Log Group (if needed):**
```bash
aws logs create-log-group \
  --log-group-name /ecs/acfbr \
  --region $AWS_REGION
```

### Step 8: Create Security Groups

**Security Group 1: ALB Security Group (`acfbr-alb-sg`)**

1. Go to VPC → Security Groups → Create security group
2. Name: `acfbr-alb-sg`
3. Description: Security group for ACFBR Application Load Balancer
4. VPC: Select your VPC (same as RDS)
5. Inbound rules:
   - Type: HTTP, Port: 80, Source: 0.0.0.0/0
   - Type: HTTPS, Port: 443, Source: 0.0.0.0/0 (for later)
6. Outbound rules: Allow all (default)
7. Create

**Security Group 2: ECS Task Security Group (`acfbr-task-sg`)**

1. Go to VPC → Security Groups → Create security group
2. Name: `acfbr-task-sg`
3. Description: Security group for ACFBR ECS tasks
4. VPC: Select your VPC (same as RDS)
5. Inbound rules:
   - Type: Custom TCP, Port: 3000, Source: `acfbr-alb-sg` (select the security group)
6. Outbound rules: Allow all (0.0.0.0/0)
7. Create

### Step 9: Create Application Load Balancer

**Via AWS Console:**
1. Go to EC2 → Load Balancers → Create Load Balancer
2. Type: Application Load Balancer
3. Name: `acfbr-alb`
4. Scheme: Internet-facing
5. IP address type: IPv4
6. VPC: Select your VPC
7. Mappings: Select at least 2 subnets (preferably in different AZs)
8. Security groups: Select `acfbr-alb-sg`
9. Listeners: HTTP :80 (add HTTPS later)
10. Create target group:
    - Target type: IP addresses
    - Target group name: `acfbr-targets`
    - Protocol: HTTP
    - Port: 3000
    - VPC: Select your VPC
    - Health check:
      - Path: `/`
      - Protocol: HTTP
      - Port: 3000
      - Healthy threshold: 2
      - Unhealthy threshold: 3
      - Timeout: 5 seconds
      - Interval: 30 seconds
11. Register targets: Skip for now (ECS will register automatically)
12. Create load balancer

### Step 10: Create ECS Service

**Via AWS Console:**
1. Go to ECS → Clusters → `acfbr-cluster` → Services tab
2. Click "Create"
3. Launch type: Fargate
4. Task definition: `acfbr` (latest revision)
5. Service name: `acfbr-service`
6. Desired tasks: 1
7. Networking:
   - VPC: Select your VPC
   - Subnets: Select at least 2 subnets (different AZs)
   - Security groups: Select `acfbr-task-sg`
   - Auto-assign public IP: ENABLED (if using public subnets) or DISABLED (if using private subnets with NAT)
8. Load balancing:
   - Load balancer type: Application Load Balancer
   - Load balancer name: `acfbr-alb`
   - Container to load balance: `acfbr:3000:3000`
   - Target group: `acfbr-targets`
9. Service auto scaling: Disable for now
10. Create service

---

## Part 3: Configure RDS Security Group

### Step 11: Allow ECS Tasks to Connect to RDS

**CRITICAL:** This is required for your app to connect to the database.

1. Go to RDS → Databases → `tdpllc-1`
2. Click on "Connectivity & security" tab
3. Under "VPC security groups", click on the security group
4. Click "Edit inbound rules"
5. Click "Add rule":
   - Type: PostgreSQL (or Custom TCP)
   - Port: 5432
   - Source: Select `acfbr-task-sg` (the ECS task security group)
   - Description: Allow ECS tasks to connect to RDS
6. Click "Save rules"

---

## Part 4: Verify Deployment

### Step 12: Check Service Status

1. Go to ECS → Clusters → `acfbr-cluster` → Services → `acfbr-service`
2. Check that tasks are running (Status: RUNNING)
3. Check the "Logs" tab to see application logs

### Step 13: Get Load Balancer URL

1. Go to EC2 → Load Balancers → `acfbr-alb`
2. Copy the DNS name (e.g., `acfbr-alb-123456789.us-west-2.elb.amazonaws.com`)
3. Test in browser: `http://<DNS-name>`

### Step 14: Check Logs

```bash
# View logs via AWS CLI
aws logs tail /ecs/acfbr --follow --region $AWS_REGION

# Or via Console: CloudWatch → Log groups → /ecs/acfbr
```

---

## Troubleshooting

### Common Issues

1. **Tasks failing to start:**
   - Check CloudWatch logs: `/ecs/acfbr`
   - Verify environment variables are set correctly
   - Check task definition CPU/memory limits

2. **Database connection errors:**
   - Verify RDS security group allows inbound from `acfbr-task-sg`
   - Check that ECS tasks and RDS are in the same VPC
   - Verify `DATABASE_URL` environment variable is correct

3. **Health check failures:**
   - Check that the app is listening on port 3000
   - Verify security groups allow traffic
   - Check application logs for errors

4. **502 Bad Gateway:**
   - Tasks might not be running
   - Check target group health
   - Verify port 3000 is correct

### Useful Commands

```bash
# List running tasks
aws ecs list-tasks --cluster acfbr-cluster --region $AWS_REGION

# Describe a task
aws ecs describe-tasks --cluster acfbr-cluster --tasks <TASK_ID> --region $AWS_REGION

# Update service (after pushing new image)
aws ecs update-service \
  --cluster acfbr-cluster \
  --service acfbr-service \
  --force-new-deployment \
  --region $AWS_REGION
```

---

## Updating the Application

When you make changes and want to deploy:

1. **Build and push new image:**
   ```bash
   # Follow Steps 1-4 from Part 1
   docker buildx build \
     --platform linux/amd64 \
     -t ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG} \
     --push .
   ```

2. **Force new deployment:**
   ```bash
   aws ecs update-service \
     --cluster acfbr-cluster \
     --service acfbr-service \
     --force-new-deployment \
     --region $AWS_REGION
   ```

   Or via Console: ECS → Services → `acfbr-service` → Update → Force new deployment

---

## Next Steps

- [ ] Set up HTTPS with ACM certificate
- [ ] Configure custom domain
- [ ] Set up auto-scaling
- [ ] Move secrets to AWS Secrets Manager
- [ ] Set up CI/CD pipeline
- [ ] Configure monitoring and alerts

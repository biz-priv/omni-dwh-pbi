# omni-dwh-pbi
This repo contains the DWH to PBI related data.
Design doc link: https://drive.google.com/file/d/1hdSif6tWrXQii6znxKsv5j5gAuY43wHc/view?usp=sharing

## Note: Docker steps to be done manually

### Steps to build and push docker image to ecr for Omni coe table

1.  Retrieve an authentication token and authenticate your Docker client to your registry.Use the AWS CLI:
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin {accountId}.dkr.ecr.us-east-1.amazonaws.com
Note: If you receive an error using the AWS CLI, make sure that you have the latest version of the AWS CLI and Docker installed.
2.  Build your Docker image using the following command. You can skip this step if your image is already built:
docker build -t omni-dwh-pbi-{env.ENVIRONMENT} .
3.  docker tag omni-dwh-pbi-{env.ENVIRONMENT}:latest {accountId}.dkr.ecr.us-east-1.amazonaws.com/omni-dwh-pbi-{env.ENVIRONMENT}:latest
4.  Run the following command to push this image to your newly created AWS repository:
docker push {accountId}.dkr.ecr.us-east-1.amazonaws.com/omni-dwh-pbi-{env.ENVIRONMENT}:latest
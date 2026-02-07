This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install dependencies:

```bash
bun install
```

Then run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on AWS Amplify

This app is configured for deployment on AWS Amplify with SSR support.

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. CDK stacks deployed (`cd infrastructure && bun run cdk deploy --all`)

### Connect Amplify to GitHub

1. **Open AWS Amplify Console**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Select the region where your CDK stacks are deployed

2. **Find Your App**
   - Look for `ark-app` in the list of Amplify apps
   - Click on the app to open it

3. **Connect Repository**
   - Click **Hosting** in the left sidebar
   - Click **Deploy** or **Get started** under "Host your web app"
   - Select **GitHub** as the repository source
   - Click **Connect branch**

4. **Authorize GitHub**
   - If prompted, authorize AWS Amplify to access your GitHub account
   - Select the repository containing this project
   - Select the `main` branch

5. **Review Build Settings**
   - Amplify will auto-detect the `amplify.yml` in the repository root
   - Verify the build settings show:
     - App root: `web`
     - Build command: `bun run build`
   - Click **Save and deploy**

6. **Wait for Deployment**
   - Amplify will provision resources and build the app
   - The build fetches environment variables from SSM Parameter Store:
     - `NEXT_PUBLIC_USER_POOL_ID`
     - `NEXT_PUBLIC_USER_POOL_CLIENT_ID`
     - `NEXT_PUBLIC_API_BASE_URL`

7. **Access Your App**
   - Once deployment completes, click the URL provided
   - Format: `https://main.<app-id>.amplifyapp.com`

### Troubleshooting

**Build fails with "Access Denied" on SSM**
- Ensure the IAM service role has `ssm:GetParameter` permissions
- The CDK stack creates this automatically via `ArkAmplifyServiceRole`

**Environment variables not set**
- Verify SSM parameters exist: `aws ssm get-parameter --name "/Ark/user-pool-id"`
- Ensure Auth and API stacks are deployed before triggering the build

**Bun installation fails**
- Check build logs for network issues
- The `~/.bun` directory is cached after first successful build

### Manual Deployment Trigger

To trigger a new deployment without pushing code:

```bash
# Get your app ID
aws amplify list-apps --query "apps[?name=='ark-app'].appId" --output text

# Start a new job
aws amplify start-job --app-id <APP_ID> --branch-name main --job-type RELEASE
```
